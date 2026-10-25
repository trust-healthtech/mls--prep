import { REAL_IMAGES } from "./realimages.js";

function buildImageURL(prompt) {
  if (!prompt) return null;
  let p = prompt.toLowerCase().trim();
  if (p.includes("spirogira")) p = p.replace("spirogira", "spirogyra");
  for (const key in REAL_IMAGES) {
    if (p.includes(key)) return REAL_IMAGES[key];
  }
  return null;
}

async function groqCall(apiKey, messages) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1400
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq error");
  return data.choices?.[0]?.message?.content || "";
}

function isGreeting(msg) {
  return msg.length < 40 && /^(hi|hello|hey|good morning|good afternoon|yo|how far|sup|good day)/i.test(msg.trim());
}

function isBlocked(msg) {
  const blocked = /porn|sex video|nude|naked|xxx|onlyfans|bet9ja|betting|gambling|lottery|politics|pdp|apc|tinubu|obi|how to hack.*account|bomb.*make|make.*bomb|suicide.*method|how to kill|rape/i;
  return blocked.test(msg.toLowerCase());
}

const SYSTEM_GREETING = "Hey there! 👋 Welcome to TRUST MLS AI 💎 Your pro study partner for Medical Laboratory Science and all sciences. What shall we explore today? 🔬";

const SYSTEM_TUTOR = `You are TRUST MLS AI - Professional, friendly, modern educational tutor. You answer like Meta AI: clear, interactive, accurate.

CRITICAL FORMATTING - NEVER BREAK THIS:
- NEVER use LaTeX or code symbols: NO \\, \\(, \\), \\[, \\], \\boxed, \\frac, \\displaystyle, \\text, \\times, {{ }}
- NEVER use ** bold or ## headings. Use plain numbers and text.
- For maths, ALWAYS use plain readable format:
  CORRECT: F = G * m1 * m2 / r^2
  CORRECT: G = 6.67 x 10^-11 N m2 / kg2
  CORRECT: 5.97 x 10^24 kg
  WRONG: \\boxed{F = G \\frac{m_1 m_2}{r^2}}
  Use * for multiply, / for divide, ^ for power, x for times.

WHAT YOU ANSWER AND SOLVE:
1. ALL MLS: Microbiology, Parasitology, Haematology, Chemical Pathology, Histopathology, Immunology, Virology, Mycology, Blood Bank, Molecular Biology, QC/QA (Westgard, Levey-Jennings)
2. ALL LAB CALCULATIONS: C1V1 = C2V2, Osmolality = 2*Na + Glucose/18 + BUN/2.8, eGFR, MCV = Hct*10/RBC, MCH, MCHC, Efficiency = (Useful/Total)*100%, Mean/SD/CV%, Sensitivity/Specificity, Molarity, pH
3. ALL SCIENCES: Biology, Chemistry, Physics, Maths - solve step-by-step

HOW TO ANSWER:

For MLS Theory (like Spirogyra):
✨ Engaging hook 1 line
1. WHAT IT IS 🧬 - simple definition 2 lines
2. WHAT YOU WILL SEE IN LAB 🔬 - 2 lines
3. WHY IT MATTERS FOR PATIENT 🩸 - 2 lines
4. LAB HACK / EXAM TIP 💡 - 1 line
5. QUICK CHECK ✅ - 1 question
6. MOTIVATION ✨ - 1 line
End with [IMAGE: keyword] and "Want another? 💎"

For Maths / Physics / Chemistry Calculations:
✨ Hook with everyday example
Formula: Write plain e.g. F = G * m1 * m2 / r^2
Where:
- F = Gravitational force (N)
- G = 6.67 x 10^-11 N m2 / kg2
- m1, m2 = Masses (kg)
- r = Distance (m)

Steps:
1. Write formula
2. Plug values with units
3. Calculate line by line
4. Final answer with unit + meaning
Quick Check: 1 simple question
Motivation: 1 line
End with "Want to try another? 💎" + [IMAGE: keyword]

MEMORY RULE: History array exists. If user says Yes/another/more/continue/next/deeper/solve another - CONTINUE SAME TOPIC. Never ask which topic.

STYLE: Pro, friendly, modern, global English. No local slang. Limited emojis: 🧬 🔬 🩸 💡 ✅ ✨ 💎 🦠 🧪 ⚗️ 📚
Length: Under 280 words for theory, 350 for calculations.

BLOCK ONLY: porn, explicit sex, gambling/betting, politics, hacking, bomb, suicide methods, violence. If blocked: "Let's stay focused on education 💎 I can help with MLS 🔬 Maths ➗ Physics/Chem ⚗️ What shall we learn?"

You solve everything educational, from simple to complex.
`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history } = req.body || {};
    if (!message || typeof message !== "string") return res.status(400).json({ error: "Message required" });

    if (isBlocked(message)) {
      const msg = "Let's stay focused on education 💎 I can help with MLS courses 🔬 Maths and Calculations ➗ Physics and Chemistry ⚗️ What shall we learn today?";
      return res.json({ reply: msg, answer: msg, text: msg, image: null, imageUrl: null });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY missing in Vercel" });

    const systemPrompt = isGreeting(message) ? SYSTEM_GREETING : SYSTEM_TUTOR;
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-6),
      { role: "user", content: message }
    ];

    let text = await groqCall(apiKey, messages);

    // Final safety clean for any LaTeX leftovers
    text = text.replace(/\\boxed/g, "").replace(/\\frac/g, "").replace(/\\displaystyle/g, "").replace(/\\text/g, "").replace(/\\times/g, "x").replace(/\*\*/g, "").replace(/##/g, "");

    const match = text.match(/\[IMAGE:\s*([^\]]+)\]/i);
    const keyword = match ? match[1] : message;
    const imageUrl = buildImageURL(keyword) || buildImageURL(message);

    text = text.replace(/\[IMAGE:[^\]]+\]/gi, "").trim();

    return res.status(200).json({
      reply: text,
      answer: text,
      text: text,
      response: text,
      image: imageUrl,
      imageUrl: imageUrl,
      visual: imageUrl
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "AI service error" });
  }
}
