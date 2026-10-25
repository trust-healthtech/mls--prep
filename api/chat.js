// api/chat.js - TRUST MLS FINAL v3 - Memory + Pro Emojis + Global + Interactive
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
      max_tokens: 900
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Groq ${res.status}`);
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

const isGreeting = (text) => {
  const t = text.toLowerCase().trim();
  return /^(hi|hello|hey|good morning|good afternoon|good day)(\s|$)/.test(t) && t.length < 35;
};

const isOffTopic = (text) => {
  const t = text.toLowerCase();
  return ["porn","sex video","nude","naked","xxx","onlyfans","politics","apc","pdp","bet9ja","how to hack","how to make bomb"].some(w => t.includes(w));
};

const SYSTEM_GREETING = `
You are TRUST MLS AI ✨ - The senior every MLS student loves. Warm, professional, global like Opera AI.
User just said Hi.
Respond: "Hey there! 👋 Welcome to TRUST MLS AI 💎 I'm your senior partner for MLS success. What shall we dive into today? 🔬 Microbiology 🦠 Parasitology 🩸 Haematology 🧪 Chemical Pathology 📚 Exam Prep Just tell me a topic or send an image/doc!" Under 50 words. Pro emojis, max 3.
`;

const SYSTEM_TUTOR = `
You are TRUST MLS AI 💎 - TRUST HEALTH TECH Senior Tutor. You HAVE MEMORY of conversation. Use it. If user says Yes, another, explain more, continue, you MUST continue SAME previous topic, never ask "Which topic were we discussing?"

MISSION: Keep interactive AI discussion alive, addictive, simple.

BOUNDARY: If NOT MLS, lab science, medical education, health: refuse politely: "I'm designed for MLS and health education only 🧬 Let's focus on lab — which topic should we tackle? 💡"

STYLE:
- NEVER use **, *, -, #, markdown. Use 1. 2. 3. clean.
- Pro emojis: 🧬 🔬 🦠 🩸 🧪 💡 ✨ ✅ but max 4 per answer.
- Global English, no local slang.
- Interactive: always end with hook question.

FOR CONCEPT QUESTIONS USE THIS FORMAT:
HOOK ✨ - shocking relatable line: "You will definitely see this tomorrow in lab 🔬"
1. WHAT IT IS 🧬: 2 lines simple
2. WHAT YOU WILL SEE IN LAB 🔬: color, appearance
3. WHY IT MATTERS 🩸: patient story
4. LAB HACK 💡: senior fast trick
5. QUICK CHECK ✅: 1 question
6. MOTIVATION ✨: 1 line
Under 180 words. End with [IMAGE: keyword] and "Want me to show you another angle? 💎"

FOR FOLLOW-UP LIKE Yes/Ok: Continue same topic deeper, add new fact, don't repeat.
`;

export default async function handler(req, res) {
  for (let k in CORS) res.setHeader(k, CORS[k]);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });

  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    
    const message = (body.message || body.prompt || body.question || body.text || "").trim();
    const apiKey = process.env.GROQ_API_KEY;
    let history = body.history || body.messages || [];

    if (!apiKey) return send(res, 500, { error: "GROQ_API_KEY missing" });
    if (!message) return send(res, 400, { error: "No message" });

    if (isOffTopic(message)) {
      return send(res, 200, {
        reply: "I'm designed for MLS and health education only 🧬 Let's stay on lab — 🔬 Microbiology, 🦠 Parasitology, 🩸 Haematology, 🧪 Chem Path? 💡",
        answer: "I'm designed for MLS and health education only",
        text: "I'm designed for MLS and health education only",
        image: null, imageUrl: null, visual: null
      });
    }

    // MEMORY - last 6 turns
    let chatHistory = [];
    if (Array.isArray(history)) {
      chatHistory = history.slice(-6).map(m => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: String(m.content || m.text || "").slice(0, 600)
      })).filter(m => m.content);
    }

    const greet = isGreeting(message) && chatHistory.length === 0;
    const systemPrompt = greet ? SYSTEM_GREETING : SYSTEM_TUTOR;

    const messagesForGroq = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
      { role: "user", content: message }
    ];

    let answer = await groqCall(apiKey, messagesForGroq);
    answer = answer.replace(/\*\*/g, "").replace(/##/g, "").replace(/\[Visual\]/gi, "").trim();

    let imageUrl = null;
    const imgMatch = answer.match(/\[IMAGE:\s*([a-zA-Z0-9_ ]+)\s*\]/i);
    if (imgMatch) {
      imageUrl = buildImageURL(imgMatch[1]);
      answer = answer.replace(/\[IMAGE:[^\]]+\]/i, "").trim();
    } else {
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
