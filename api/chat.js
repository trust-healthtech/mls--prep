// ============================================================
// TRUST HEALTH TECH — FINAL PRO 2026/2027 — PRODUCTION READY
// TEXT: openai/gpt-oss-20b + llama-3.3-70b-versatile
// VISION: meta-llama/llama-4-maverick + scout (verified key v2)
// Provider: Groq — 100% working
// ============================================================

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const TEXT_MODELS = [
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant"
];

const VISION_MODELS = [
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.2-11b-vision-preview",
  "llama-3.2-90b-vision-preview"
];

const MAX_MESSAGE = 6000;
const MAX_DOC_TEXT = 15000;
const MAX_HISTORY = 10;
const MAX_IMAGE_BASE64 = 1250000;

const SYSTEM_PROMPT = `You are TRUST MLS AI Assistant - MLS and Sciences expert.

UPLOAD POLICY: You CAN receive images and documents via + button. Never say you can't. If asked "Can I upload?" say: Yes, tap + below — up to 2 images (JPG/PNG/WEBP) or 1 PDF/DOCX/TXT 100MB. I will explain it.

TEACHING STYLE - PRODUCTION RULE:
- Default: Explain clearly with markdown headings (##, ###), bold key terms, bullet lists, emojis. Be concise.
- Tables: Use tables ONLY when breaking down complex concepts, comparing/differentiating, classifications, lab values, or step-wise procedures. Don't use tables for simple explanations.
- For formulas NEVER use LaTeX. Use plain: MCV (fL) = [Hct (%) / RBC (x10^6/uL)] x 10
- Scope: MLS and Sciences only. Health topics only as clinical correlation.
- For images: Describe what you see accurately, then explain MLS principle, interpretation, clinical correlation.

Core mission: Deliver accurate MLS education with clear real-time explanation.`;

class ServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
  }
}

function safeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-MAX_HISTORY).filter(item => item && ["user","assistant"].includes(item.role) && typeof item.content === "string" && item.content.trim()).map(item => ({ role: item.role, content: item.content.trim().slice(0,6000) }));
}

function normalizeImage(item) {
  if (typeof item === "string") return { data: item, mime: "image/jpeg" };
  if (!item || typeof item !== "object" || typeof item.data !== "string") return null;
  const mime = typeof item.mime === "string" ? item.mime.toLowerCase() : "image/jpeg";
  const supported = ["image/jpeg","image/png","image/webp"];
  if (!supported.includes(mime)) throw new ServiceError("Unsupported image format. Use JPG, PNG, or WEBP.",400);
  return { data: item.data, mime };
}

async function callGroqWithFallback(apiKey, models, messages, maxTokens) {
  let lastError = null;
  for (const model of models) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, temperature: 0.35, max_tokens: maxTokens, top_p: 0.9 }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));
      const data = await res.json().catch(()=>({}));
      if (!res.ok) {
        if (res.status === 429) throw new ServiceError("⏳ High traffic. Wait 10 seconds and retry.",429);
        const detail = data?.error?.message || `HTTP ${res.status}`;
        const lower = detail.toLowerCase();
        if (lower.includes("does not exist") || lower.includes("decommissioned") || lower.includes("not have access") || lower.includes("model_not_found")) {
          lastError = detail;
          continue;
        }
        throw new ServiceError(`Groq error: ${detail}`,502);
      }
      const answer = data?.choices?.[0]?.message?.content;
      if (typeof answer !== "string" || !answer.trim()) throw new ServiceError("Empty response. Please retry.",502);
      return answer.trim();
    } catch (e) {
      if (e instanceof ServiceError && e.status === 429) throw e;
      if (e instanceof ServiceError && e.status === 400) throw e;
      lastError = e.message || "Unknown error";
    }
  }
  throw new ServiceError(`AI is busy right now. Please retry in a moment. (${lastError})`,502);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control","no-store");
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") return res.status(200).json({ status: "TRUST MLS AI — PRODUCTION READY", scope: "MLS + Sciences", text_models: TEXT_MODELS, vision_models: VISION_MODELS });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY missing in Vercel" });
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON request body." }); } }
    if (!body || typeof body !== "object" || Array.isArray(body)) return res.status(400).json({ error: "Invalid request body." });
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (message.length > MAX_MESSAGE) return res.status(413).json({ error: "Please keep your question under 6,000 characters." });
    const imagesRaw = Array.isArray(body.images) ? body.images : [];
    if (imagesRaw.length > 2) return res.status(400).json({ error: "A maximum of two images is supported per request." });
    const images = imagesRaw.map(normalizeImage);
    if (images.some((image) => !image)) return res.status(400).json({ error: "One of the attached images has an invalid format." });
    for (const image of images) {
      if (!image.data || image.data.length > MAX_IMAGE_BASE64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.data)) {
        return res.status(413).json({ error: "Image too large or invalid. Choose a smaller JPG/PNG < 1MB." });
      }
    }
    const docText = typeof body.docText === "string" ? body.docText.slice(0, MAX_DOC_TEXT).trim() : "";
    if (images.length && docText) return res.status(400).json({ error: "Send up to two images or one document per request, not both." });
    if (!message && !images.length && !docText) return res.status(400).json({ error: "Enter a question or attach readable study material." });
    const chatHistory = safeHistory(body.chatHistory);
    let userText = message;
    if (!userText) {
      userText = images.length ? "Please analyze the uploaded image(s) and explain the MLS concept clearly. If it's a lab result, organism, or instrument, explain principle, interpretation and clinical correlation." : "Please explain and summarize the uploaded study document, highlighting key MLS and Sciences concepts. Use headings and only use tables if needed to break down complex parts.";
    }
    if (docText) userText += "\n\n[Extracted document text]\n" + docText;
    let userMessage;
    if (images.length > 0) {
      const contentParts = [{ type: "text", text: userText }];
      for (const img of images) {
        contentParts.push({ type: "image_url", image_url: { url: `data:${img.mime};base64,${img.data}` } });
      }
      userMessage = { role: "user", content: contentParts };
    } else {
      userMessage = { role: "user", content: userText };
    }
    const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...chatHistory, userMessage];
    const models = images.length ? [...VISION_MODELS, ...TEXT_MODELS] : TEXT_MODELS;
    const reply = await callGroqWithFallback(apiKey, models, messages, images.length ? 3000 : 2500);
    return res.status(200).json({ reply, success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unexpected AI service error.";
    return res.status(200).json({ reply: msg });
  }

                                                                                                                                                                              }
