// api/chat.js — THT MLS PREP Groq API (Vercel serverless)

const GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const TEXT_MODEL =
  process.env.GROQ_TEXT_MODEL ||
  "llama-3.3-70b-versatile";

const VISION_MODEL =
  process.env.GROQ_VISION_MODEL ||
  "meta-llama/llama-4-maverick-17b-128e-instruct";

const VISION_FALLBACKS = [
  "llama-3.2-90b-vision-preview",
  "llama-3.2-11b-vision-preview"
];

const MAX_DOC_CHARS = 90000;
const MAX_IMAGE_DATA_URL_CHARS = 1_350_000;

const SYSTEM_PROMPT = `
You are TRUST MLS AI, a Medical Laboratory Science tutor
specialized in Nigerian MLS education.

Your role is to help students understand MLS concepts,
laboratory procedures, calculations, examinations,
and scientific principles accurately.

EDUCATIONAL RESPONSE GUIDELINES:

1. Explain concepts clearly using simple language.
2. Use correct scientific and medical terminology.
3. Highlight important MLS examination points.
4. Explain common misconceptions where relevant.
5. Include calculations step by step when required.
6. Use mnemonics only when they are scientifically accurate.
7. Never invent references, sources, or verification.
8. If uncertain, state the uncertainty honestly.
9. Distinguish educational information from patient-specific
   medical diagnosis or treatment.
10. Never pretend to see image details that are unclear.

For relevant questions, organize answers using:

TOPIC:
KEY EXPLANATION:
KEY POINTS:
MLS EXAM TIP:
COMMON MISTAKE:

Keep simple questions concise.
Do not force unnecessary headings into every response.

IMAGE ANALYSIS:
When images are provided, examine the submitted image content
and explain only what can reasonably be identified.

For microscopy questions, distinguish illustrative examples
from authentic microscopy findings.

VISUAL ILLUSTRATIONS:
When an educational illustration would materially help,
append one final marker:

[GENERATE_IMAGE: concise educational illustration description]

Use this for appropriate topics such as blood cell morphology,
parasites, bacteria, fungi, histology and laboratory equipment.

Do not add the marker for ordinary calculations or topics
where a generated illustration would not help.
`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};

function send(res, status, payload) {
  Object.entries(CORS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  return res.status(status).json(payload);
}

function pickString(...values) {
  for (const value of values) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}

function normalizeImage(value, name) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  let data = value.trim();

  // Accept supported image data URLs.
  if (
    /^data:image\/(png|jpe?g|webp);base64,/i.test(data)
  ) {
    return data;
  }

  // HEIC/HEIF must be converted by the frontend.
  if (
    /^data:image\/(heic|heif);base64,/i.test(data)
  ) {
    throw new Error(
      "HEIC/HEIF must be converted to JPG or PNG before analysis."
    );
  }

  // Do not accept arbitrary remote image URLs.
  if (/^https?:\/\//i.test(data)) {
    throw new Error(
      "Remote image URLs are not accepted. Send a compressed image data URL."
    );
  }

  // Accept raw base64 only.
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(data)) {
    throw new Error("Unsupported image encoding.");
  }

  const ext = (name || "").toLowerCase();

  const mime =
    /\.png$/.test(ext)
      ? "image/png"
      : /\.webp$/.test(ext)
        ? "image/webp"
        : "image/jpeg";

  return `data:${mime};base64,${data.replace(/\s/g, "")}`;
}

function getImages(body) {
  const raw = [
    body.image,
    body.image1,
    body.image2,
    body.imageBase64,
    body.base64Image
  ].filter(
    value =>
      typeof value === "string" &&
      value.trim()
  );

  if (Array.isArray(body.images)) {
    for (const item of body.images) {
      if (typeof item === "string") {
        raw.push(item);
      } else if (
        item &&
        typeof item.data === "string"
      ) {
        raw.push(item.data);
      }
    }
  }

  if (Array.isArray(body.attachments)) {
    for (const attachment of body.attachments) {
      if (
        attachment &&
        (
          attachment.kind === "image" ||
          attachment.type === "image"
        ) &&
        typeof attachment.data === "string"
      ) {
        raw.push(attachment.data);
      }
    }
  }

  const unique = [...new Set(raw)];

  if (unique.length > 2) {
    throw new Error(
      "A maximum of two images is allowed."
    );
  }

  return unique.map((value, index) =>
    normalizeImage(
      value,
      body.fileName ||
      body.filename ||
      `image${index + 1}.jpg`
    )
  );
}

function responseFields(finalText) {
  return {
    reply: finalText,
    answer: finalText,
    response: finalText,
    text: finalText,
    message: finalText,
    content: finalText,
    result: finalText
  };
}

function wantsVisual(message) {
  return /\b(show image|real image|picture|diagram|draw|visual|generate image|photo|microscopic|illustrate)\b/i
    .test(message);
}

async function groqCall(
  key,
  model,
  messages,
  options = {}
) {
  const controller = new AbortController();

  const timeout = setTimeout(
    () => controller.abort(),
    options.timeout || 55000
  );

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        model,
        messages,
        temperature: 0.55,
        max_tokens: 1800
      }),

      signal: controller.signal
    });

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        data?.error?.message ||
        `Groq request failed (${response.status}).`
      );

      error.status = response.status;

      throw error;
    }

    const answer =
      data?.choices?.[0]?.message?.content;

    if (
      typeof answer !== "string" ||
      !answer.trim()
    ) {
      throw new Error(
        "Groq returned an empty answer."
      );
    }

    return answer.trim();

  } finally {
    clearTimeout(timeout);
  }
}

function buildImageURL(prompt) {
  const clean = String(
    prompt ||
    "medical laboratory science educational illustration"
  )
    .replace(/[\r\n]+/g, " ")
    .slice(0, 700)
    .trim();

  const enhanced =
    `${clean}, medical laboratory, educational illustration, clean background`;

  const seed = Math.floor(
    Math.random() * 2147483647
  );

  return (
    "https://image.pollinations.ai/prompt/" +
    encodeURIComponent(enhanced) +
    "?width=512&height=512&model=flux&nologo=true&seed=" +
    seed
  );
}

export default async function handler(req, res) {

  Object.entries(CORS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return send(res, 405, {
      error: "Method not allowed."
    });
  }

  try {

    let body = req.body;

    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return send(res, 400, {
          error: "Request body is not valid JSON."
        });
      }
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return send(res, 400, {
        error: "A JSON object is required."
      });
    }

    const message = pickString(
      body.message,
      body.prompt,
      body.question,
      body.text,
      body.content,
      body.query
    );

    let doc = pickString(
      body.extractedText,
      body.docText
    );

    // Support extracted document text in attachments.
    if (
      !doc &&
      Array.isArray(body.attachments)
    ) {
      const attachment = body.attachments.find(
        item =>
          item &&
          typeof item.text === "string"
      );

      if (attachment) {
        doc = attachment.text;
      }
    }

    // Bound document context.
    if (doc.length > MAX_DOC_CHARS) {
      doc =
        doc.slice(0, MAX_DOC_CHARS) +
        "\n[Document text truncated for safe processing.]";
    }

    const images = getImages(body);

    if (
      !message &&
      !doc &&
      images.length === 0
    ) {
      return send(res, 400, {
        error:
          "Enter a question or attach supported study material."
      });
    }

    // Check compressed image size.
    if (
      images.some(
        image =>
          image.length > MAX_IMAGE_DATA_URL_CHARS
      )
    ) {
      return send(res, 413, {
        error:
          "Image payload is too large after compression. Please reselect or compress the image."
      });
    }

    const key = process.env.GROQ_API_KEY;

    if (!key) {
      return send(res, 500, {
        error:
          "GROQ_API_KEY is not configured on Vercel."
      });
    }

    let prompt =
      message ||
      "Explain the supplied study material and identify its key learning points.";

    if (doc) {
      prompt =
        "STUDENT UPLOADED MLS DOCUMENT CONTENT:\n" +
        doc +
        "\n\nSTUDENT QUESTION:\n" +
        prompt +
        "\n\nUse the document as reference together with " +
        "your MLS knowledge. If the document is incomplete " +
        "or appears to conflict with established knowledge, " +
        "identify the uncertainty clearly.";
    }

    // Keep recent conversation context.
    const history = Array.isArray(body.history)
      ? body.history.slice(-8)
      : [];

    const prior = history
      .filter(
        item =>
          item &&
          typeof item.content === "string" &&
          item.content.length < 12000
      )
      .map(item => ({
        role:
          item.role === "user"
            ? "user"
            : "assistant",
        content: item.content
      }));

    let answer;

    // IMAGE REQUEST: use vision models only.
    if (images.length > 0) {

      const content = [
        {
          type: "text",
          text: prompt
        },

        ...images.map(url => ({
          type: "image_url",
          image_url: {
            url
          }
        }))
      ];

      const messages = [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },

        ...prior,

        {
          role: "user",
          content
        }
      ];

      const visionModels = [
        ...new Set([
          VISION_MODEL,
          ...VISION_FALLBACKS
        ])
      ];

      let visionError = null;

      for (const model of visionModels) {

        try {
          answer = await groqCall(
            key,
            model,
            messages
          );

          visionError = null;
          break;

        } catch (error) {

          visionError = error;

          // Do not keep retrying authentication,
          // permission or quota failures.
          if (
            error.status === 401 ||
            error.status === 403 ||
            error.status === 429
          ) {
            break;
          }
        }
      }

      if (visionError) {
        const details = String(
          visionError.message ||
          "Vision service failed."
        ).slice(0, 700);

        throw new Error(
          "Vision analysis failed after trying available " +
          "vision models. " +
          details
        );
      }

    } else {

      // TEXT REQUEST: use the configured text model.
      answer = await groqCall(
        key,
        TEXT_MODEL,
        [
          {
            role: "system",
            content: SYSTEM_PROMPT
          },

          ...prior,

          {
            role: "user",
            content: prompt
          }
        ]
      );
    }

    // Replace the AI's image instruction with a
    // frontend-compatible image placeholder.
    const tag =
      /\[GENERATE_IMAGE:\s*([\s\S]*?)\s*\]/i;

    const match = answer.match(tag);

    const auto = wantsVisual(message);

    let finalText = answer;

    if (match) {

      finalText = answer.replace(
        tag,
        "\n\n@@THT_IMAGE_0@@\n\n"
      );

    } else if (auto) {

      finalText +=
        "\n\n@@THT_IMAGE_0@@";
    }

    return send(
      res,
      200,
      responseFields(finalText)
    );

  } catch (error) {

    const status =
      Number.isInteger(error.status) &&
      error.status >= 400 &&
      error.status < 600
        ? error.status
        : 500;

    const message =
      error.name === "AbortError"
        ? "The AI request timed out. Please retry."
        : (
            error.message ||
            "Unexpected AI service error."
          );

    return send(res, status, {
      error: message
    });
  }
}
