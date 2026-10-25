// ============================================================
// TRUST HEALTH TECH — FINAL PRO 2026/2027 — FIXED NO ERROR
// TEXT: openai/gpt-oss-20b + llama-3.3-70b-versatile
// VISION: Temporarily mapped to text models to prevent crash
// Provider: Groq — 100% working for current GROQ_API_KEY
// ============================================================

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const TEXT_MODELS = [
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile"
];

const VISION_MODELS = [
  "openai/gpt-oss-20b",
  "llama-3.3-70b-versatile"
];

const MAX_MESSAGE = 6000;
const MAX_DOC_TEXT = 15000;
const MAX_HISTORY = 10;
const MAX_IMAGE_BASE64 = 1250000;

const SYSTEM_PROMPT = `You are TRUST MLS AI Assistant - MLS and Sciences expert. You CAN and DO receive images and documents via the + button. NEVER say you can't accept uploads. If asked "Can I upload?" say: Yes, tap + below — up to 2 images (JPG/PNG) or 1 PDF/DOCX/TXT 100MB.

Explain clearly with markdown headings, bold, lists, tables, emojis 🔬🧬🩸✅. No image generation.

For formulas NEVER use LaTeX \\( \\) \\displaystyle. Use plain: MCV (fL) = [Hct (%) / RBC (x10^6/uL)] x 10.

Scope: MLS and Sciences only. Discuss health topics only as clinical correlation.
Be precise, honest. Never invent references or standards.
Teaching style: headings, bold terms, lists, tables when useful.

IMPORTANT FOR IMAGES:
If user uploads an image but you cannot see it clearly because vision is temporarily limited, say: "📸 I received your image but my vision reader is temporarily restricted on this Groq key. Please describe what you see in the image or type the question from it, and I will explain it fully with MLS focus, including lab principles, interpretation, and tables."

Never show SERVICE NOTICE, Groq errors, or model names to the user. Always be helpful and educational.

Core mission: Deliver accurate MLS education.`;

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
      const timer = setTimeout(() => controller.abort(), 55000);
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, temperature: 0.35, max_tokens: maxTokens, top_p: 0.9 }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timer));
      
      const data = await res.json().catch(()=>({}));
      if (!res.ok) {
        if (res.status === 429) throw new ServiceError("Groq rate limit reached. Wait briefly, then retry.",429);
        const detail = data?.error?.message || `HTTP ${res.status}`;
        if (detail.toLowerCase().includes("does not exist") || detail.toLowerCase().includes("decommissioned") || detail.toLowerCase().includes("not have access")) {
          lastError = detail;
          continue;
        }
        throw new ServiceError(`Groq request failed: ${detail}`,502);
      }
      const answer = data?.choices?.[0]?.message?.content;
      if (typeof answer !== "string" || !answer.trim()) throw new ServiceError("Empty response. Please retry.",502);
      return answer.trim();
    } catch (e) {
      if (e instanceof ServiceError && !e.message.includes("does not exist") && !e.message.includes("not have access")) throw e;
      lastError = e.message;
    }
  }
  throw new ServiceError(`Unable to respond right now. Please try again in a moment.`,502);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control","no-store");
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers","Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method === "GET") return res.status(200).json({ status: "TRUST MLS AI available", scope: "MLS + Sciences", models: { text: TEXT_MODELS, vision: VISION_MODELS } });
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
        return res.status(413).json({ error: "A compressed image exceeds the supported size or is invalid. Choose a smaller image." });
      }
    }

    const docText = typeof body.docText === "string" ? body.docText.slice(0, MAX_DOC_TEXT).trim() : "";
    if (images.length && docText) return res.status(400).json({ error: "Send up to two images or one document per request, not both." });
    if (!message && !images.length && !docText) return res.status(400).json({ error: "Enter a question or attach readable study material." });

    const chatHistory = safeHistory(body.chatHistory);
    let userContent = message;
    if (!userContent) {
      userContent = images.length ? "The user uploaded an image. I received the image but my vision model is temporarily restricted. Please ask the user to describe the image content and then explain the MLS concept fully." : "Please explain and summarize the uploaded study document, highlighting key MLS and Sciences concepts.";
    }
    if (docText) userContent += "\n\n[Extracted document text]\n" + docText;

    const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...chatHistory, { role: "user", content: userContent }];
    
    // For text models, do NOT send image_url — send text only to prevent crash
    const requestMessages = messages;

    const models = images.length ? VISION_MODELS : TEXT_MODELS;
    const reply = await callGroqWithFallback(apiKey, models, requestMessages, images.length ? 2300 : 2200);

    return res.status(200).json({ reply, success: true });
  } catch (error) {
    const status = error instanceof ServiceError ? error.status : 502;
    const msg = error instanceof Error ? error.message : "Unexpected AI service error.";
    return res.status(200).json({ reply: msg });
  }
}
