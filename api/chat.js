// Vercel serverless function: keeps GEMINI_API_KEY on the server.
// Configure GEMINI_API_KEY in the deployment environment, never in browser storage.

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return sendJson(res, 503, { error: "AI service is not configured" });

  const body = req.body || {};
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question) return sendJson(res, 400, { error: "Question is required" });
  if (question.length > MAX_QUESTION_LENGTH) {
    return sendJson(res, 413, { error: "Question is too long" });
  }

  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY_ITEMS) : [];
  const memory = Array.isArray(body.memory) ? body.memory.slice(-12) : [];
  const contents = history
    .filter(item => item && (item.role === "user" || item.role === "model") && typeof item.content === "string")
    .map(item => ({ role: item.role, parts: [{ text: item.content.slice(0, MAX_QUESTION_LENGTH) }] }));

  // The current question is sent separately so it is always included exactly once.
  contents.push({ role: "user", parts: [{ text: question }] });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: [
              "You are Trust AI, an expert Medical Laboratory Science tutor.",
              "Answer the learner's complete question accurately and clearly.",
              "Use headings, definitions, mechanisms, procedures, interpretation, reference ranges, calculations, and exam tips when relevant.",
              "Never address the learner as CEO.",
              "Do not provide patient-specific diagnoses. State that educational information does not replace qualified clinical advice.",
              "Learner memory: " + (memory.join(" | ") || "No saved memory.")
            ].join(" ") }]
          },
          contents,
          generationConfig: { temperature: 0.4, maxOutputTokens: 1200 }
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error("Gemini error", response.status, data);
      return sendJson(res, 502, { error: "AI provider request failed" });
    }

    const answer = data.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!answer) return sendJson(res, 502, { error: "AI returned an empty response" });
    return sendJson(res, 200, { answer });
  } catch (error) {
    console.error("AI proxy error", error);
    return sendJson(res, 502, { error: "AI service temporarily unavailable" });
  }
};
