// api/chat.js — TRUST HEALTH TECH / MLS PREP - FIXED VERSION
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

// FIXED MODELS - use models that exist on Groq today
const TEXT_MODEL = process.env.GROQ_TEXT_MODEL || "llama-3.3-70b-versatile";
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";

const MAX_QUESTION_CHARS = 6000;
const MAX_ATTACHMENT_COUNT = 1;
const MAX_TEXT_CHARS = 45000;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // changed to 3 MB to match UI
const MAX_HISTORY_MESSAGES = 8;
const MAX_HISTORY_CHARS = 16000;

const SYSTEM_PROMPT = `You are TRUST MLS AI, a professional educational assistant specializing in Medical Laboratory Science (MLS), medicine, and health education.
... [keep your same prompt] ...`;

function reply(res, status, payload) {
  return res.status(status).json(payload);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return reply(res, 405, { error: "Method not allowed." });
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const question = typeof body.question === "string" ? body.question.trim() : typeof body.message === "string" ? body.message.trim() : "";
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];

    if (!question && attachments.length === 0) {
      return reply(res, 400, { error: "Enter an MLS, medical, or health education question or attach a supported file." });
    }

    const key = process.env.GROQ_API_KEY;
    if (!key) {
      console.error("TRUST MLS AI: GROQ_API_KEY is not configured.");
      return reply(res, 503, { error: "AI service not configured: GROQ_API_KEY missing in Vercel. Add it in Settings > Environment Variables." });
    }

    // history handling same as yours...
    const historyIn = Array.isArray(body.history) ? body.history : [];
    let historyBudget = 0;
    const history = historyIn.slice(-MAX_HISTORY_MESSAGES).flatMap((item) => {
      if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string") return [];
      const content = item.content.slice(0, 4000);
      if (historyBudget + content.length > MAX_HISTORY_CHARS) return [];
      historyBudget += content.length;
      return [{ role: item.role, content }];
    });

    let model = TEXT_MODEL;
    let userContent = question || "Please explain the attached educational material.";
    const extra = [];

    for (const a of attachments) {
      if (!a || typeof a !== "object") return reply(res, 400, { error: "The attachment information is invalid." });
      
      const name = typeof a.name === "string" ? a.name.slice(0, 180) : "Study material";
      const kind = typeof a.kind === "string" ? a.kind : "";
      const mime = typeof a.mime === "string" ? a.mime.toLowerCase() : "";

      if (kind === "image" || mime.startsWith("image/")) {
        if (!["image/jpeg","image/png","image/webp"].includes(mime) && !["image/jpeg","image/png","image/webp"].includes(kind)) {
           // allow by mime check
        }
        if (typeof a.data !== "string" || !a.data.length) {
          return reply(res, 400, { error: "The image data is missing. Please select the image again." });
        }
        const approxBytes = Math.floor(a.data.length * 3 / 4);
        if (approxBytes > MAX_IMAGE_BYTES) {
          return reply(res, 413, { error: "This image exceeds 3 MB. Please use a smaller image." });
        }
        model = VISION_MODEL;
        userContent = [
          { type: "text", text: (question || "Explain this educational MLS image.") + `\n\nAttachment: ${name}. Analyze only visible evidence.` },
          { type: "image_url", image_url: { url: `data:${mime};base64,${a.data}` } }
        ];
      } else if (kind === "text" || typeof a.text === "string") {
        const excerpt = (a.text || "").slice(0, MAX_TEXT_CHARS);
        extra.push(`\n\nSTUDENT-PROVIDED TEXT EXCERPT — ${name}:\n${excerpt}`);
      } else {
        return reply(res, 415, { error: "Unsupported attachment type. Use JPEG, PNG, WebP." });
      }
    }

    if (extra.length && typeof userContent === "string") {
      userContent += extra.join("\n");
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: userContent }
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 55000);

    let upstream;
    try {
      upstream = await fetch(API_URL, {
        method: "POST",
        signal: controller.signal,
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 1800 })
      });
    } finally { clearTimeout(timeout); }

    const providerData = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      console.error("Groq error:", upstream.status, JSON.stringify(providerData).slice(0,500));
      if (upstream.status === 400 || upstream.status === 404) {
        return reply(res, 502, { error: `Model error (${model}). Set GROQ_TEXT_MODEL=llama-3.3-70b-versatile and GROQ_VISION_MODEL=meta-llama/llama-4-scout-17b-16e-instruct in Vercel.` });
      }
      if (upstream.status === 429) return reply(res, 503, { error: "AI service busy. Please retry." });
      return reply(res, 502, { error: "AI provider could not complete request. Try again." });
    }

    const answer = providerData?.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim()) {
      return reply(res, 502, { error: "AI returned empty response." });
    }
    return reply(res, 200, { status: "online", answer: answer.trim() });

  } catch (err) {
    if (err?.name === "AbortError") return reply(res, 504, { error: "AI timeout. Try smaller image." });
    console.error("Handler failed:", err?.message);
    return reply(res, 500, { error: "Unexpected AI service error. Please try again." });
  }
      }
