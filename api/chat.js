// Vercel serverless function: keeps the Groq API key on the server.
// Configure GROQ_API_KEY in the deployment environment, never in browser storage.

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const MAX_QUESTION_LENGTH = 4000;
const MAX_HISTORY_ITEMS = 16;

function sendJson(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return res.json(payload);
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (req.method !== "POST") return sendJson(res, 405, { error: "Method not allowed" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return sendJson(res, 503, { error: "AI service is not configured" });

  const body = req.body || {};
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return sendJson(res, 400, { error: "Question is required" });
  if (question.length > MAX_QUESTION_LENGTH) {
    return sendJson(res, 413, { error: "Question is too long" });
  }

  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY_ITEMS) : [];
  const memory = Array.isArray(body.memory) ? body.memory.slice(-12) : [];

  const messages = [
    {
      role: "system",
      content: [
        "You are Trust AI - Professor level MLS, Medicine, Nursing, Anatomy, Physiology, Pharmacology, Molecular Biology.",
        "Answer at BMLS final year + MSc level.",
        "For every question give: Definition, Principle/Mechanism, Detailed procedure/pathway, Reagents/Equipment, Normal values + SI units, Interpretation, Error causes, QC, Clinical correlation, 2 exam MCQs.",
        "Never refuse any health question.",
        "Teacher memory: " + (memory.join(" | ") || "No saved memory.")
      ].join(" ")
    },
    ...history
      .filter(item => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
      .map(item => ({
        role: item.role === "assistant" ? "assistant" : "user",
        content: item.content.slice(0, MAX_QUESTION_LENGTH)
      }))
  ];

  messages.push({ role: "user", content: question });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.4,
        max_tokens: 500
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Groq error", response.status, data);
      return sendJson(res, 502, { error: "AI provider request failed" });
    }

    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) return sendJson(res, 502, { error: "AI returned an empty response" });
    return sendJson(res, 200, { answer });
  } catch (error) {
    console.error("AI proxy error", error);
    return sendJson(res, 502, { error: "AI service temporarily unavailable" });
  }
};
