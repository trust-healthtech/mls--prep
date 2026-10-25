// api/chat.js - FINAL WITH MEMORY + EMOJIS + GLOBAL
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
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: TEXT_MODEL, messages, temperature: 0.85, max_tokens: 900 })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || `Groq ${res.status}`);
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

const isGreeting = (t) => /^(hi|hello|hey|good morning|good afternoon|yo|sup|good day)(\s|$)/.test(t.toLowerCase().trim()) && t.trim().length < 35;
const isOffTopic = (t) => ["porn","sex video","nude","xxx","onlyfans","politics","apc","pdp","tinubu","bet9ja","how to hack","how to make bomb"].some(w => t.toLowerCase().includes(w));

const SYSTEM_GREETING = `You are TRUST MLS AI ✨ Warm, pro, global like Opera AI. User said Hi. Welcome: "Hey there! 👋 Welcome to TRUST MLS AI 💎 I'm your senior for lab success. What shall we dive into? 🔬 Microbiology 🦠 Parasitology 🩸 Haematology 🧪 Chem Path 📚 Exam Prep" Under 50 words.`;

const SYSTEM_TUTOR = `
You are TRUST MLS AI 💎 Senior Tutor. You HAVE MEMORY of conversation. Use it! If user says "Yes", "explain more", "another one", continue previous topic, don't jump.
Rules: No ** markdown. Use 1. 2. 3. Pro emojis 🧬🔬🦠🩸💡 max 4. Simple Year1-5. Global English.
If concept: Start HOOK ✨ then 1.WHAT IT IS 🧬 2.WHAT YOU WILL SEE IN LAB 🔬 3.WHY IT MATTERS 🩸 4.LAB HACK 💡 5.QUICK CHECK ✅ 6.MOTIVATION ✨ Under 180 words. End [IMAGE: keyword] and "Want me to show you another one? 💎"
If general: Friendly step-by-step.
Boundary: Only MLS/health. Refuse others: "I'm for MLS/health only 🧬 Let's focus on lab 💡"
`;

export default async function handler(req, res) {
  for (let k in CORS) res.setHeader(k, CORS[k]);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  try {
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);
    
    const message = pickString(body.message, body.prompt, body.question, body.text, body.query);
    let history = body.history || body.messages || []; // FRONTEND WILL SEND HISTORY
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return send(res, 500, { error: "GROQ_API_KEY missing" });
    if (!message) return send(res, 400, { error: "No message" });

    if (isOffTopic(message)) {
      return send(res, 200, {
        reply: "I'm designed for MLS and health education only 🧬 Let's stay on lab — 🔬 Microbiology, 🦠 Parasitology, 🩸 Haematology, 🧪 Chem Path?",
        answer: "I'm designed for MLS and health education only", text: "I'm designed for MLS and health education only", image: null, imageUrl: null, visual: null
      });
    }

    // BUILD MEMORY - Keep last 6 turns
    let chatHistory = [];
    if (Array.isArray(history)) {
      chatHistory = history.slice(-6).map(m => ({
        role: m.role === "user" || m.role === "assistant" ? m.role : "user",
        content: String(m.content || m.text || "").slice(0, 500)
      })).filter(m => m.content);
    }

    const isGreet = isGreeting(message) && chatHistory.length === 0;
    const systemToUse = isGreet ? SYSTEM_GREETING : SYSTEM_TUTOR;

    const messagesForGroq = [
      { role: "system", content: systemToUse },
      ...chatHistory,
      { role: "user", content: message }
    ];

    let answer = await groqCall(apiKey, messagesForGroq);
    answer = answer.replace(/\*\*/g, "").replace(/\*/g, "").replace(/##/g, "").replace(/\[Visual\]/gi, "").trim();

    let imageUrl = null;
    const match = answer.match(/\[IMAGE:\s*([a-zA-Z0-9_ ]+)\s*\]/i);
    if (match) { imageUrl = buildImageURL(match[1]); answer = answer.replace(/\[IMAGE:[^\]]+\]/i, "").trim(); }
    else imageUrl = buildImageURL(message + " " + chatHistory.map(h=>h.content).join(" "));
    if (!imageUrl) imageUrl = buildImageURL(message);

    return send(res, 200, { reply: answer, answer, text: answer, image: imageUrl, imageUrl, visual: imageUrl });

  } catch (err) { return send(res, 500, { error: err.message || "Server error" }); }
}
