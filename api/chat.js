import { REAL_IMAGES } from "./realimages.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "openai/gpt-oss-20b";

const SYSTEM_PROMPT = `
You are THT MLS Senior Tutor - TRUST HEALTH TECH. You are that senior student everyone wants to sit next to. Warm, sharp, real. No fake AI.

RULES:
- NEVER use **, *, -, #, markdown, bullets with dash. Use plain numbers 1. 2. 3. or clean paragraphs.
- Keep language simple. Year 1 to Year 5 must understand.
- No broad MLCN syllabus lecture. Teach like you are showing them in the lab.

HOOK FORMAT FOR EVERY ANSWER (this keeps beginners hooked):

Start with HOOK (1 line): Something shocking, relatable or "You will see this tomorrow in lab"

Then:
1. WHAT IT IS: Simple explanation in 2 lines max
2. WHAT YOU WILL SEE IN LAB: Real appearance, color, movement
3. WHY IT MATTERS: One patient story or why lab tech must not miss it
4. LAB HACK: How senior techs identify it fast
5. QUICK CHECK: Ask 1 question to make them think
6. MOTIVATION: One line to keep them going

At the end ALWAYS add: [IMAGE: keyword]
Example: [IMAGE: spirogyra] or [IMAGE: ascaris] or [IMAGE: gram stain]

Keep total answer under 180 words. Short, punchy, addictive. Like TikTok but for MLS.
End with: Want me to show you another one?
`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const send = (res, status, payload) => {
  for (let k in CORS) res.setHeader(k, CORS[k]);
  return res.status(status).json(payload);
};

const pickString = (...vals) => {
  for (let v of vals) if (typeof v === "string" && v.trim()) return v.trim();
  return "";
};

const buildImageURL = (prompt) => {
  let safe = String(prompt || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim();
  safe = safe.replace("spirogira", "spirogyra").replace("spiro gyra", "spirogyra");
  for (const key in REAL_IMAGES) {
    if (safe.includes(key)) return REAL_IMAGES[key];
  }
  return null;
};

async function groqCall(apiKey, messages) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 800
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Groq ${res.status}`);
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

export default async function handler(req, res) {
  for (let k in CORS) res.setHeader(k, CORS[k]);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const message = pickString(body.message, body.prompt, body.question, body.text, body.query);
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return send(res, 500, { error: "GROQ_API_KEY missing in Vercel" });
    if (!message) return send(res, 400, { error: "No message" });

    let answer = await groqCall(apiKey, [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: message }
    ]);

    // Clean markdown
    answer = answer.replace(/\*\*/g, "").replace(/\*/g, "").replace(/##/g, "").replace(/\[Visual\]/gi, "").trim();

    let imageUrl = null;
    const match = answer.match(/\[IMAGE:\s*([a-zA-Z0-9_ ]+)\s*\]/i);
    if (match) {
      imageUrl = buildImageURL(match[1]);
      answer = answer.replace(/\[IMAGE:[^\]]+\]/i, "").trim();
    } else {
      imageUrl = buildImageURL(message);
    }

    // Fallback: try to get image from user message if still null
    if (!imageUrl) {
      imageUrl = buildImageURL(message);
    }

    return send(res, 200, {
      reply: answer,
      answer: answer,
      text: answer,
      image: imageUrl,
      imageUrl: imageUrl,
      visual: imageUrl
    });

  } catch (err) {
    return send(res, 500, { error: err.message || "Server error" });
  }
}
