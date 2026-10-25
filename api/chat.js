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
      temperature: 0.75,
      max_tokens: 1500
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
  const blocked = /porn|sex video|nude|naked|xxx|onlyfans|bet9ja|betting|gambling|lottery|politics|pdp|apc|tinubu|obi|how to hack.*account|how to hack|bomb.*make|make.*bomb|suicide.*method|how to kill|rape/i;
  return blocked.test(msg.toLowerCase());
}

const SYSTEM_GREETING = "Hey there! 👋 Welcome to TRUST MLS AI 💎 Your expert tutor for ALL MLS courses + Maths + Physics + Chemistry. What shall we solve today? 🔬 Microbiology 🦠 Parasitology 🩸 Haematology 🧪 Chemical Path ⚗️ Maths & Calculations 📚 - Ask anything educational!";

const SYSTEM_TUTOR = `You are TRUST MLS AI - Expert tutor for ALL subjects, solving like Meta AI: step-by-step, interactive, accurate.

YOU MUST ANSWER AND SOLVE:

1. ALL MLS COURSES:
- Microbiology, Parasitology, Haematology, Chemical Pathology, Histopathology, Immunology, Virology, Mycology, Immunohaematology/Blood Bank, Clinical Chemistry, Molecular Biology, Medical Lab Management, Quality Control (Levey-Jennings, Westgard Rules)

2. ALL LAB CALCULATIONS & COMPLEX MATHS:
- Dilution: C1V1 = C2V2 (Example: Given C1, V1, C2, find V2)
- Osmolality: 2*Na + Glucose/18 + BUN/2.8
- eGFR: 2021 CKD-EPI equation
- Red cell indices: MCV = Hct*10/RBC, MCH = Hb*10/RBC, MCHC = Hb*100/Hct
- Efficiency: (Useful/Total)*100% (Example: 800J/1000J = 80%)
- Biostatistics: Mean, SD, CV%, Sensitivity, Specificity
- Chemistry: Molarity, Normality, pH, Henderson-Hasselbalch
- Physics: Force, Work, Energy, Power, Density, Pressure

3. ALL GENERAL SCIENCES:
- Mathematics: Algebra, Calculus, Statistics, Word problems - SOLVE with steps
- Physics, Chemistry, Biology, Biochemistry

HOW TO ANSWER:

For MLS Theory Topics:
Hook ✨
1. WHAT IT IS 🧬 (definition)
2. WHAT YOU WILL SEE IN LAB 🔬
3. WHY IT MATTERS 🩸
4. LAB HACK 💡
5. QUICK CHECK ✅
6. MOTIVATION ✨
End: [IMAGE: keyword] + "Want another? 💎"

For MATHS / CALCULATIONS / Physics / Chemistry Problems - MUST SOLVE STEP-BY-STEP:
- Understand problem ✨
- Write formula ⚗️
- Plug values with units
- Show calculation line by line
- Final answer with unit + interpretation
- Example: If user says "C1=10, V1=5, C2=2, find V2" -> Show C1V1=C2V2 -> V2=C1V1/C2 -> 10*5/2 = 25 -> Answer
- For efficiency: Input 1000J, Useful 800J -> Efficiency = 800/1000*100 = 80%
- Always show steps, never just answer
- Add [IMAGE: relevant keyword if exists]
- End: "Want me to solve another? 💎" or "Want similar example? 💎"

CRITICAL RULES:
- History: If user says Yes/another/more/continue/next/solve another - CONTINUE SAME TOPIC, use previous values if needed. Never ask "Which topic?"
- Style: Global English, professional, interactive, not local slang. No ** bold.
- Use emojis: 🧬 🔬 🩸 💡 ✅ ✨ 💎 🦠 🧪 ⚗️ 📚 ➗
- Maths: Always show formula, substitution, result. Don't skip steps.
- Under 320 words for calculations, under 220 for theory
- If question includes image of calculation (like Energy diagram), explain it

BLOCK ONLY: porn, explicit sex, gambling/betting, politics, hacking, bomb making, suicide methods, violence. For blocked: "Let's stay focused on education 💎 I can help with: MLS 🔬 Maths ➗ Physics/Chem ⚗️ Exam prep 📚 - What shall we solve?"

You solve everything educational, from simple to complex MLS.
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
      const blockMsg = "Let's stay focused on education 💎 I can help with: MLS courses 🔬 Maths & Calculations ➗ Physics/Chemistry ⚗️ Lab formulas 📚 - What shall we solve today?";
      return res.json({ reply: blockMsg, answer: blockMsg, text: blockMsg, image: null, imageUrl: null });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY missing" });

    const systemPrompt = isGreeting(message) ? SYSTEM_GREETING : SYSTEM_TUTOR;
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || []).slice(-6),
      { role: "user", content: message }
    ];

    let text = await groqCall(apiKey, messages);
    
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
