// api/chat.js — FINAL READY - 1 GROQ KEY ONLY - NO DEAD MODEL - 2026
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "openai/gpt-oss-20b";
const VISION_MODEL = "meta-llama/llama-4-maverick-17b-128e-instruct";
const MAX_DOC_CHARS = 90000;
const MAX_IMAGE_DATA_URL_CHARS = 1350000;

const SYSTEM_PROMPT = `You are THT MLS PREP — Elite MLS tutor built by Trust Health Tech (THT).
SCOPE: ONLY answer MLS (hematology, microbiology, biochemistry, histology, parasitology, immunology, transfusion, calculations, QC), medical/health education, and THT platform questions.
If unrelated say: "I'm Trust MLS AI, focused on MLS / Medical & Health Education and THT platform only, How may i Help you?."
For MLS academic use:
TOPIC:
[Clear explanation]
KEY POINTS TO KNOW:
MLS EXAM TRAP:
MNEMONIC / HACK:
CBT SPEED TIP:
COMMON MISTAKE:
Visual: Add [GENERATE_IMAGE: concise 5-8 words] only when illustration helps.`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};

const send = (res, s, p) => {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  return res.status(s).json(p);
};

const pickString = (...v) => {
  for (const x of v) if (typeof x === "string" && x.trim()) return x.trim();
  return "";
};

function normalizeImage(v, n) {
  if (typeof v !== "string" || !v.trim()) return null;
  let d = v.trim();
  if (/^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=\r\n]+$/i.test(d)) return d;
  if (/^https?:\/\//i.test(d)) throw new Error("Remote URLs not accepted.");
  const ext = (n || "").toLowerCase();
  const mime = /\.png$/.test(ext) ? "image/png" : /\.webp$/.test(ext) ? "image/webp" : "image/jpeg";
  return `data:${mime};base64,${d.replace(/\s/g, "")}`;
}

function getImages(b) {
  const raw = [b.image, b.image1, b.image2, b.imageBase64, b.base64Image].filter(v => typeof v === "string" && v.trim());
  if (Array.isArray(b.images)) for (const x of b.images) { if (typeof x === "string") raw.push(x); else if (x?.data) raw.push(x.data); }
  if (Array.isArray(b.attachments)) for (const a of b.attachments) { if (a && (a.kind === "image" || a.type === "image") && typeof a.data === "string") raw.push(a.data); }
  const uniq = [...new Set(raw)];
  if (uniq.length > 2) throw new Error("Max 2 images.");
  return uniq.map((x, i) => normalizeImage(x, b.fileName || `image${i+1}.jpg`));
}

const responseFields = (t) => ({ reply: t, answer: t, response: t, text: t, message: t, content: t, result: t });
const wantsVisual = (m) => /\b(show image|image of|picture|diagram|draw|visual|generate image|photo|microscopic|illustrate|morphology|amoeba|spirogyra)\b/i.test(m || "");

const buildImageURL = (p) => {
  let raw = String(p || "").toLowerCase();
  raw = raw.replace(/generate|create|make|give|show|please|image|picture|photo|an|a|the/g, " ").replace(/\s+/g, " ").trim();
  let safe = raw.replace(/[^a-zA-Z0-9 ]/g, " ").trim().slice(0, 50);
  if (!safe) safe = "cell";
  const MLS_MAP = {
    amoeba: "Entamoeba histolytica trophozoite with pseudopods nucleus food vacuole under light microscope realistic microbiology",
    spirogyra: "Spirogyra green algae filament spiral chloroplast under light microscope realistic biology textbook"
  };
  let enhanced = "";
  for (const k in MLS_MAP) if (safe.includes(k)) { enhanced = MLS_MAP[k]; break; }
  if (!enhanced) enhanced = `${safe} under light microscope, realistic medical laboratory science, MLS microbiology textbook, highly detailed educational`;
  enhanced += ", no person, no human face, no woman, no portrait, biology only, microscope view";
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?width=1024&height=1024&model=turbo&nologo=true&nofeed=true&safe=true&seed=${Date.now()}`;
};

async function groqCall(k, model, messages) {
  const c = new AbortController();
  const to = setTimeout(() => c.abort(), 55000);
  try {
    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${k}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: 0.55, max_tokens: 1800 }),
      signal: c.signal
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(data?.error?.message || `Groq ${r.status}`); e.status = r.status; throw e; }
    const out = data?.choices?.[0]?.message?.content;
    if (typeof out !== "string" || !out.trim()) throw new Error("Empty answer.");
    return out.trim();
  } finally { clearTimeout(to); }
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
  try {
    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch { return send(res, 400, { error: "Invalid JSON." }); } }
    if (!body || typeof body !== "object") return send(res, 400, { error: "JSON object required." });
    const message = pickString(body.message, body.prompt, body.question, body.text, body.content, body.query);
    let doc = pickString(body.extractedText, body.docText);
    if (doc.length > MAX_DOC_CHARS) doc = doc.slice(0, MAX_DOC_CHARS) + "\n[Truncated]";
    const images = getImages(body);
    if (!message && !doc && !images.length) return send(res, 400, { error: "Enter MLS question." });
    const key = process.env.GROQ_API_KEY;
    if (!key) return send(res, 500, { error: "GROQ_API_KEY missing in Vercel." });
    let prompt = message || "Explain study material.";
    if (doc) prompt = `DOCUMENT:\n${doc}\n\nQUESTION: ${prompt}`;
    const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
    const prior = history.filter(h => h?.content && h.content.length < 12000).map(h => ({ role: h.role === "user" ? "user" : "assistant", content: h.content }));
    let answer;
    if (images.length) {
      const content = [{ type: "text", text: prompt }, ...images.map(u => ({ type: "image_url", image_url: { url: u } }))];
      answer = await groqCall(key, VISION_MODEL, [{ role: "system", content: SYSTEM_PROMPT }, ...prior, { role: "user", content }]);
    } else {
      answer = await groqCall(key, TEXT_MODEL, [{ role: "system", content: SYSTEM_PROMPT }, ...prior, { role: "user", content: prompt }]);
    }
    const tag = /\[GENERATE_IMAGE:\s*([\s\S]*?)\s*\]/i;
    const m = answer.match(tag);
    let finalText = answer;
    if (m) {
      let rawPrompt = m[1].trim().split(/\s+/).slice(0, 8).join(" ").replace(/[^a-zA-Z0-9 ]/g, " ").trim();
      if (!rawPrompt) rawPrompt = "medical lab illustration";
      const url = buildImageURL(rawPrompt);
      finalText = answer.replace(tag, `\n\n![Visual](${url})\n\n`);
    } else if (wantsVisual(message)) {
      let rawPrompt = message.split(/\s+/).slice(0, 6).join(" ").replace(/[^a-zA-Z0-9 ]/g, " ").trim();
      finalText += `\n\n![Visual](${buildImageURL(rawPrompt)})\n\n`;
    }
    return send(res, 200, responseFields(finalText));
  } catch (err) {
    const status = err.status >= 400 && err.status < 600 ? err.status : 500;
    return send(res, status, { error: err.message || "AI error" });
  }
}
