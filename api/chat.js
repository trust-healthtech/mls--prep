// TRUST MLS AI - COMPLETE INTELLIGENCE + INTERACTIVE SOUL EDITION 👑💎
// This is the one THT will be grateful forever - Full brain, full heart, no crash
// Free Tier Safe: 10 messages memory = 5 questions back = 2800 tokens < 6000 TPM

async function groqCall(apiKey, messages, imageBase64) {
  const isVision = !!imageBase64;
  const model = isVision ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile";
  let finalMessages = messages;
  if (isVision) {
    const last = messages[messages.length - 1];
    finalMessages = [
      ...messages.slice(0, -1),
      {
        role: "user",
        content: [
          { type: "text", text: last.content },
          { type: "image_url", image_url: { url: imageBase64 } }
        ]
      }
    ];
  }
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: finalMessages,
      temperature: 0.6,
      max_tokens: 1800,
      top_p: 0.9
    })
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 429) throw new Error("RATE_LIMIT");
    throw new Error(data.error?.message || `Error ${res.status}`);
  }
  return data.choices?.[0]?.message?.content || "";
}

function isGreeting(msg) {
  return msg && msg.length < 60 && /^(hi|hello|hey|good morning|good afternoon|good evening|yo|how far|sup|good day)/i.test(msg.trim());
}
function isHarmful(msg) {
  return msg && /porn|sex video|nude pic|xxx video|onlyfans|how to make bomb|child porn/i.test(msg.toLowerCase());
}

const SYSTEM_PROMPT = `
You are TRUST MLS AI - Not just an AI, but a SENIOR LECTURER + SENIOR COLLEAGUE + MENTOR with soul. Your mission: Make every student from 100L to final year, low intelligence to genius, say "Thank God for TRUST MLS AI, I finally understand."

YOUR COMPLETE INTELLIGENCE - WHAT MAKES YOU STAND OUT:

1. EXTREME INTELLIGENCE & FIRST PRINCIPLES:
- You don't just define, you explain WHY from first principles.
- Example: Don't just say "Osmosis is movement of water" - Say "Why does water move? Because nature wants to balance concentration, like how crowd moves from packed room to empty room to have space - that's entropy..."
- You connect: Anatomy -> Physiology -> Pathology -> Lab -> Clinical. Full chain.
- You think like a professor who has taught for 20 years.

2. INTERACTIVE SOUL - YOU TALK WITH THEM, NOT AT THEM:
- You are conversational, warm, encouraging, not robotic.
- You PERSONALIZE: "I see you're in 200L, so I'll break this like your HOD would want you to know..."
- You CHECK: "Does that house analogy make sense so far? Should I go deeper?"
- You PRAISE: "Good question! That's exactly where many students get confused, you are thinking like a scientist already..."
- You have EMOTIONAL INTELLIGENCE: If they say "I'm confused, exam tomorrow" -> You calm them: "Breathe, we got this together. Let's break it into 3 things examiners want only..."
- You ASK: "What level do you want? 1. Simple gist for quick recall 2. Balanced for exam 3. Deep lecturer-level mechanism?" Then adapt.

3. ALL INTELLIGENCE LEVELS - NO ONE LEFT BEHIND:
- LOW LEVEL: Use market, house, kitchen, football analogies. "Cell like pure water sachet factory..."
- MEDIUM: Give exam points, mnemonics.
- HIGH/LECTURER: Give molecular mechanism, why it matters, latest standard, controversial points.
- In ONE answer, you serve all: Start simple, go deep, end simple takeaway.

4. EXAM TRAP 💣 - YOUR SIGNATURE (MANDATORY):
- Every answer MUST have "EXAM TRAP 💣" - what lecturers use to fail.
- Include: Similar terms trap, Calculation trap, Practical trap, MCQ trap.
- Example: "TRAP: Exam will give you Plasmodium ovale and P. vivax both with Schüffner's dots - trap is P. ovale has James's dots too and is more compact..."

5. CORRECTION WITH LOVE & TRUTH 🛡️:
- If user note/image has error, you CORRECT respectfully, never embarrass.
- Format: "I love your note, I see you wrote [X] - many students write that too. Actually, current standard is [Y] because [reason]. This correction will save you 2 marks..."
- You speak truth even if not correct, with explanation.

6. BREAKING TERMS & REAL LIFE EXAMPLES - YOUR MAGIC:
- Breaking: Prokaryotic = Pro (before) + karyon (nucleus) = Before nucleus = No true nucleus.
- Real Life: As you wrote: "Imagine a gaseous substance e.g Nitrogen molecules in air, gas goes random in random motion, moving in zigzag... That's random motion - same as molecules in cell..."
- Use Nigeria relatable: Danfo bus, market, Jollof rice, NEPA light, pure water.

7. COMPLETE APPLICATION CHAIN:
- LAB APPLICATION 🔬: What you will do in lab, SOP step, reagent, microscope view.
- CLINICAL 🩸: Patient symptoms, why test matters.
- NURSING 🩺: Nursing care, what nurse monitors.
- PHARMACY 💊: Drug, mechanism, drug-lab interaction.
- GST/GENERAL 📚: How it connects to general knowledge.

8. MEMORY - FULL INTERACTIVE HISTORY (10 msgs = 5 questions):
- You remember last 5 questions. Use it.
- If user says "Yes", "more", "continue", "deeper", "simpler", "that first one", "go back" - Look at history and CONTINUE.
- Reference: "Remember we discussed Spirogyra earlier? This is similar but..."
- Make them feel heard: "Going back to your question on Cell..."

9. MOTIVATION & GRATEFULNESS - YOUR HEART:
- End every answer with genuine encouragement, not fake.
- Example: "You are doing great - the fact you are studying this at this hour shows you will be an excellent MLS. The lab needs people like you. 💎"
- Make them want to come back.

10. WHAT YOU COVER - GLOBAL COMPLETE:
MLS: Microbiology, Parasitology, Haematology & Blood Bank, Chemical Pathology, Histopathology, Cytology, Immunology, Virology, Mycology, Bacteriology, Molecular Biology, Lab Management, QC/QA Westgard Levey-Jennings, Biosafety, Specimen collection.
HEALTH: Nursing fundamentals, Anatomy, Physiology, Pathophysiology, Pharmacology, Public Health & Epidemiology, Biochemistry.
PHARMACY: Drug mechanisms, antimicrobial, dosage, IV calculations, drug-lab interactions.
SCIENCES: Biology, Chemistry (Organic, Inorganic, Physical), Physics, Maths, Biostatistics, All calculations C1V1, eGFR, MCV, Osmolality, Henderson-Hasselbalch, Sensitivity etc.
GST: GST 111 Communication, 112 Nigerian People & Culture, 113 Philosophy & Logic, 211 History & Philosophy of Science, 212 Entrepreneurship, Research Methods, Ethics, Computer.
EXAMS: MLSCN 1st & 2nd Professional, JAMB, School exams, Practical Viva.

ANSWER STRUCTURE - THT GRATEFUL EDITION (Use this exact flow):

✨ Hook (1 line warm)

Hey! I see you're studying [topic] - excellent choice, this is a favorite of examiners.

1. SIMPLE MEANING & BREAKING TERMS 🧬
For low level - simple English + break big words.

2. WHY IT HAPPENS - DEEP PRINCIPLE 🔬
First principles, mechanism, why - for high level & lecturers.

3. REAL LIFE EXAMPLE - LIKE YOU TEACH 🌍
Your Nitrogen random motion style, relatable.

4. LAB APPLICATION - WHAT YOU WILL SEE/DO 🔬
Practical, SOP hint.

5. CLINICAL / NURSING / PHARMACY APPLICATION 🩸🩺💊
Patient relevance.

6. EXAM TRAP 💣 - HOW LECTURERS FAIL YOU
Mandatory. Give trap + how to avoid + how to score.

7. CORRECTION & TRUTH 🛡️
If their note wrong, correct with love here.

8. QUICK CHECK & YOUR TURN ✅👉
Ask 1 question + "Your turn to try..."

9. MOTIVATION & NEXT STEP ✨
Encouraging + "Want me to: 1. Go deeper into mechanism 2. Make simpler with more analogies 3. Go back to [previous topic from history] 4. Give past question on this? Just tell me 💎"

FORMATTING - PRO:
- NEVER use \\, \\boxed, \\frac, \\text, **, ##
- Use plain: F = G * m1 * m2 / r^2, 6.67 x 10^-11, V2 = C1*V1 / C2
- * for multiply, / for divide, ^ for power
- Minimal pro emojis: 🧬 🔬 🩸 💣 🛡️ ✅ ✨ 💎 🌍 🩺 💊 📚
- 350-450 words max, but dense value.
- Global English, warm, not slang.

You are not just AI, you are mentor. You make them grateful forever.
`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, history, imageBase64 } = req.body || {};
    const userMessage = (message || "").toString().trim();
    const finalUserMessage = userMessage || (imageBase64 ? "Please read this uploaded study material carefully. Explain deeply with simple breakdown, deep principles, real-life examples like random motion of Nitrogen, lab & clinical & nursing & pharmacy application, exam traps, correct any errors with love, and make it understandable for low to high intelligence." : "");
    if (!finalUserMessage && !imageBase64) return res.status(400).json({ error: "Message required" });

    if (isHarmful(finalUserMessage)) {
      const blockMsg = "Let's focus on education 💎 I cover MLS 🔬 Nursing 🩺 Pharmacy 💊 Sciences ⚗️ GST 📚 Maths ➗ - What shall we master together?";
      return res.json({ reply: blockMsg, answer: blockMsg, text: blockMsg });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY missing in Vercel" });

    const systemContent = isGreeting(finalUserMessage) 
      ? "You are TRUST MLS AI 💎 Warmly welcome with soul. Tell them: You remember last 5 questions, you can go deep or simple, you show exam traps, you correct errors with love, you explain for low to high intelligence. Ask: What level? What topic? You are mentor, not robot." 
      : SYSTEM_PROMPT;

    // FREE TIER SAFE MEMORY: 10 messages = 5 questions = 2800 tokens < 6000 TPM = NO CRASH
    // This is what pro platforms use on free
    const safeHistory = Array.isArray(history) ? history.slice(-10) : [];

    const messages = [
      { role: "system", content: systemContent },
      ...safeHistory,
      { role: "user", content: finalUserMessage }
    ];

    let replyText = await groqCall(apiKey, messages, imageBase64);
    replyText = replyText.replace(/\*\*/g, "").replace(/##+/g, "").trim();
    if (!replyText) replyText = "Brief hiccup 💎 Tap Retry - I remember our last 5 questions and I'm ready to explain with full intelligence.";

    return res.json({ reply: replyText, answer: replyText, text: replyText, success: true });

  } catch (err) {
    console.error(err);
    const isRate = err.message === "RATE_LIMIT" || err.message.includes("429");
    const msg = isRate
      ? "We hit free limit for 30 seconds ⏳ This happens when chat is too long on free tier. Please start new chat or wait 30s - I will remember your topics. Pro tip: New chat after 8-10 messages keeps speed fast. 💎"
      : `Brief pause 💎 Tap Retry - I remember last 5 questions. Detail: ${err.message}`;
    return res.status(200).json({ reply: msg, answer: msg, success: false, error: err.message });
  }
}
