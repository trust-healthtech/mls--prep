import { REAL_IMAGES } from "./realimages.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "openai/gpt-oss-20b";

const SYSTEM_GREETING = "Hey there! 👋 Welcome to THT I am TRUST MLS AI 💎 What shall we dive into? 🔬 Microbiology 🦠 Parasitology 🩸 Haematology 🧪 Chemical Pathology 📚 Exam Prep - Ask me anything!";

const SYSTEM_TUTOR = `You are TRUST MLS AI - Professional Medical Lab Science Tutor for Nigeria MLSCN curriculum.

CRITICAL MEMORY RULE: You have history array. If user says Yes/another/more/continue/next/deeper - CONTINUE SAME PREVIOUS TOPIC. Never say "Which topic were we discussing?".

FORMAT (strict):
Hook ✨ (1 line)
1. WHAT IT IS 🧬 (2 lines)
2. WHAT YOU WILL SEE IN LAB 🔬 (2 lines)
3. WHY IT MATTERS FOR PATIENT 🩸 (2 lines)
4. LAB HACK / EXAM TIP 💡 (1 line)
5. QUICK CHECK ✅ (1 question)
6. MOTIVATION ✨ (1 line)

Rules: Under 180 words. No ** bold. Use 1. 2. 3. numbering. Use only 4 pro emojis: 🧬 🔬 🩸 💡 ✅ ✨ 💎 🦠 🧪. End with [IMAGE: keyword] on new line + "Want another? 💎" on next line. Global English, no local slang like "oga, shey, ashawo". Professional.

If off-topic: Respond "Let's stay focused on Medical Lab Science 💎 Which topic: Microbiology 🔬 Parasitology 🦠 Haematology 🩸 Chemical Pathology 🧪?"

`;

const OFF_TOPIC_REPLY = "Let's stay focused on Medical Lab Science 💎 Which topic: Microbiology 🔬 Parasitology 🦠 Haematology 🩸 Chemical Pathology 🧪?";

function buildImageURL(prompt) {
  let normalized = String(prompt || "").toLowerCase().replace(/spirogira/g, "spirogyra");
  for (const key in REAL_IMAGES) {
    if (normalized.includes(key)) return REAL_IMAGES[key];
  }
  return null;
}

function isGreeting(msg) {
  return msg.length < 35 && /hi|hello|hey|good morning/.test(msg.toLowerCase());
}

function isOffTopic(msg) {
  return /porn|sex video|nude|xxx|bet9ja|betting|politics|pdp|apc|hack|bomb|suicide/.test(msg.toLowerCase());
}

async function groqCall(apiKey, messages) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.85,
      max_tokens: 900
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Groq request failed (${response.status}): ${detail.slice(0, 500)}`);
  }
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Groq returned an empty response.");
  }
  return text.trim();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return res.status(400).json({ error: "Message is required." });

    if (isOffTopic(message)) return res.status(200).json({ reply: OFF_TOPIC_REPLY });

    if (isGreeting(message)) {
      return res.status(200).json({ reply: SYSTEM_GREETING });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "AI service is not configured. Please contact the administrator." });
    }

    const history = Array.isArray(body.history)
      ? body.history.slice(-6).filter(item =>
          item &&
          (item.role === "user" || item.role === "assistant") &&
          typeof item.content === "string"
        )
      : [];

    const messages = [
      { role: "system", content: SYSTEM_TUTOR },
      ...history,
      { role: "user", content: message }
    ];

    const generated = await groqCall(apiKey, messages);
    const imageMatch = generated.match(/\[IMAGE:\s*([^\]]+)\]/i);
    const imageUrl = imageMatch ? buildImageURL(imageMatch[1].trim()) : null;
    const text = generated
      .replace(/\s*\[IMAGE:\s*[^\]]+\]\s*/i, "\n")
      .trim();

    return res.status(200).json({
      reply: text,
      answer: text,
      text,
      image: imageUrl,
      imageUrl,
      visual: imageUrl
    });
  } catch (error) {
    console.error("TRUST MLS AI handler error:", error);
    return res.status(500).json({ error: "An error occurred while generating the response. Please try again." });
  }
}
