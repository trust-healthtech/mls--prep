// api/chat.js - TRUST MLS FINAL - Friendly + Pro Emojis + Global
import { REAL_IMAGES } from "./realimages.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "openai/gpt-oss-20b";

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
      temperature: 0.85,
      max_tokens: 800
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Groq ${res.status}`);
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

const isGreeting = (text) => {
  const t = text.toLowerCase().trim();
  return /^(hi|hello|hey|good morning|good afternoon|yo|sup|how far|how are you|hi there|hello there|hey there|good day)(\s|$)/.test(t) && t.length < 35;
};

const isOffTopic = (text) => {
  const t = text.toLowerCase();
  const blocked = ["porn", "sex video", "nude", "naked", "xxx", "onlyfans", "politics", "apc", "pdp", "tinubu", "peter obi", "atiku", "election rigging", "bet9ja", "betting", "how to hack", "how to make bomb", "suicide"];
  return blocked.some(w => t.includes(w));
};

const SYSTEM_GREETING = `
You are TRUST MLS AI ✨ - The senior every MLS student loves. Warm, professional, global, friendly like Opera AI.

User just said Hi.

Respond: "Hey there! 👋 Welcome to TRUST MLS AI 💎 I'm your senior partner for MLS success. Ready to make lab simple?

What shall we dive into today?
🔬 Microbiology
🦠 Parasitology
🩸 Haematology
🧪 Chemical Pathology
📚 Exam Prep

Just tell me a topic or send an image/doc!"

Keep under 50 words. Use emojis pro, not childish. 1 emoji per line max. Be welcoming.
`;

const SYSTEM_TUTOR = `
You are TRUST MLS AI - TRUST HEALTH TECH Senior Tutor 💎. Warm, sharp, global, professional. Built for students from Nigeria to worldwide. No local slang. No fake AI.

MISSION: Keep students addicted, make complex simple, make them pay later willingly because value is high.

BOUNDARY: If question is NOT MLS, laboratory science, medical education, health: REFUSE politely: "I'm designed for MLS and health education only 🧬 Let's focus on lab — which topic should we tackle? 💡" Do NOT answer porn, politics, betting, hacking, violence.

STYLE RULES:
- NEVER use **, *, -, #, markdown.
- Use numbers 1. 2. 3. or clean paragraphs.
- Use pro emojis: 🧬 🔬 🦠 🩸 🧪 💡 ✨ ✅ but max 4 per answer.
- Keep Year 1 to Year 5 understanding. Break complex into simple.

FOR CONCEPT/DEFINITION QUESTIONS - USE HOOK FORMAT:
Line 1: HOOK ✨ - shocking, relatable: "You will definitely see this tomorrow in lab 🔬"

Then:
1. WHAT IT IS 🧬: 2 lines max, simple
2. WHAT YOU WILL SEE IN LAB 🔬: Real color, movement, appearance
3. WHY IT MATTERS 🩸: One patient story, why tech must not miss
4. LAB HACK 💡: Senior fast ID trick
5. QUICK CHECK ✅: 1 question to think
6. MOTIVATION ✨: One line

Under 180 words. Punchy, addictive.
End: [IMAGE: keyword] example [IMAGE: spirogyra]
End with: Want me to show you another one? 💎

FOR GENERAL HELP / EXPLANATIONS: Be friendly, step-by-step, pro, use emojis to guide, not forced hook.
`;

export default async function handler(req, res) {
  for (let k in CORS) res.setHeader(k, CORS[k]);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    const message = pickString(body.message, body.prompt, body.question, body.text, body.query);
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return send(res, 500, { error: "GROQ_API_KEY missing" });
    if (!message) return send(res, 400, { error: "No message" });

    if (isOffTopic(message)) {
      return send(res, 200, {
        reply: "I'm designed for MLS and health education only 🧬 I can't help with that topic. Let's stay on lab — which area should we dive into? 🔬 Microbiology, 🦠 Parasitology, 🩸 Haematology, or 🧪 Chem Path?",
        answer: "I'm designed for MLS and health education only",
        text: "I'm designed for MLS and health education only",
        image: null, imageUrl: null, visual: null
      });
    }

    const systemToUse = isGreeting(message) ? SYSTEM_GREETING : SYSTEM_TUTOR;

    let answer = await groqCall(apiKey, [
      { role: "system", content: systemToUse },
      { role: "user", content: message }
    ]);

    answer = answer.replace(/\*\*/g, "").replace(/\*/g, "").replace(/##/g, "").replace(/\[Visual\]/gi, "").trim();

    let imageUrl = null;
    const match = answer.match(/\[IMAGE:\s*([a-zA-Z0-9_ ]+)\s*\]/i);
    if (match) {
      imageUrl = buildImageURL(match[1]);
      answer = answer.replace(/\[IMAGE:[^\]]+\]/i, "").trim();
    } else {
      imageUrl = buildImageURL(message);
    }
    if (!imageUrl) imageUrl = buildImageURL(message);

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
