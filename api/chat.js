// TRUST MLS AI - FINAL 100% PRECISE 2026/2027 - Honest + Opera/ChatGPT Style
// Academic Session: 2026/2027 - to help you ace this academic session
// Functions: Text Explanation + Vision Upload Reader + Exam Traps + CGPA Institution-Aware
// NO AI Image Generation - Only Upload Reader
// Models: openai/gpt-oss-20b | meta-llama/llama-4-scout-17b-16e-instruct
// Memory: 10 msgs history - works on 1/2/3/yes/more/continue

async function groqCall(apiKey, messages, imageBase64) {
  const isVision = !!imageBase64;
  const model = isVision ? "meta-llama/llama-4-scout-17b-16e-instruct" : "openai/gpt-oss-20b";
  let finalMessages = messages;
  if (isVision) {
    const last = messages[messages.length - 1];
    finalMessages = [
      ...messages.slice(0, -1),
      { role: "user", content: [{ type: "text", text: last.content }, { type: "image_url", image_url: { url: imageBase64 } }] }
    ];
  }
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: finalMessages, temperature: 0.68, max_tokens: 2200, top_p: 0.9 })
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 404 || data.error?.message?.toLowerCase().includes("model")) {
      const fb = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: messages.filter(m => typeof m.content === 'string'), temperature: 0.65, max_tokens: 2200 })
      });
      const fbData = await fb.json();
      if (fb.ok) return fbData.choices?.[0]?.message?.content || "";
    }
    throw new Error(data.error?.message || `Error ${res.status}`);
  }
  return data.choices?.[0]?.message?.content || "";
}

function isGreeting(msg) { return msg && msg.length < 80 && /^(hi|hello|hey|good morning|good afternoon|good evening)/i.test(msg.trim()); }
function isHarmful(msg) { return msg && /porn|sex video|nude pic|xxx video|onlyfans|how to make bomb|child porn/i.test(msg.toLowerCase()); }
function isCGPARequest(msg) { return msg && /cgpa|gpa|grade point|calculate my result|my gp|compute my cgpa|cumulative/i.test(msg.toLowerCase()); }

// PRECISE MEMORY FIX - Converts 1/2/3 to real intent
function expandShortInput(userMsg, history) {
  const c = userMsg.trim().toLowerCase();
  if (["1","2","3","one","two","three"].includes(c)) {
    if (c === "1" || c === "one") return "Explain a topic deeply - give full breakdown to help me ace this academic session 2026/2027";
    if (c === "2" || c === "two") return "Give me Quick revision + exam traps + CBT speed tricks + recall cues + CGPA booster for the last topic in our history. If no topic yet, ask me for a topic.";
    if (c === "3" || c === "three") return "Calculate my CGPA for this academic session 2026/2027";
  }
  if (["yes","yeah","more","continue","deeper","simpler","explain","go ahead","proceed","that one","first one","go back"].includes(c)) {
    return userMsg + " - Continue from history, use last topic";
  }
  return userMsg;
}

const SYSTEM_PROMPT = `
You are TRUST MLS AI - to help you ace this academic session 2026/2027.
Style: Opera AI Aria + ChatGPT - Bold, Structured, Honest, Professional, Warm.
NO AI Image Generation. Vision is ONLY to READ uploaded study images/documents.

CRITICAL RULES - 100% PRECISE:
1. NO IMAGE GEN: Never say you generate images. You only READ uploads.
2. MEMORY: You have history of last 10 messages. ALWAYS use it. If user types "2", it means Option 2 Quick revision. Do it. Never say "I'm not sure what 2 refers to".
3. FORMATTING: Use **bold** for labels: **Simple Meaning:**, **Exam Trap 💣:**, **CGPA Booster:**. Use ### for sections, - for bullets. This is Opera/ChatGPT style.
4. NO INSTITUTIONS unless CGPA: Never mention ABU, KASU, FUBK, etc in normal answers. Only when CGPA request.
5. NO LIES: Never say "I remember your last 5 questions" in greeting. Keep memory silent but functional.
6. BE DIRECT: Answer only what asked, like ChatGPT. Don't add unnecessary A-Z if user asks simple.
7. TRUSTWORTHY LANGUAGE: Use "to help you ace this academic session 2026/2027" not "built for 2026". End with "Stay focused, let's work on your CGPA together for this session."

YOUR A-Z INTELLIGENCE:
- First Principles WHY: Explain why water moves? Equilibrium - high to low to balance entropy.
- All Levels: Simple analogy (lab production line, filtration, factory) -> Medium exam points mnemonics -> High molecular per MLSCN/ASCP/CLSI/WHO 2026/2027 -> Simple takeaway.
- Exam Trap Mandatory: Every full explanation MUST have **Exam Trap 💣:**.
- Correction with Respect: "Well attempted - you wrote X, many write that. Current CLSI/MLSCN 2026/2027 standard is Y because... This secures marks..."
- Breaking Terms + Real Life: **Prokaryotic** = Pro + karyon. **Haemoglobin** = Haeme + globin. Real life: "Imagine Nitrogen molecules moving random zigzag colliding - that's diffusion in plasma..."
- Chain Only If Relevant: Lab SOP + QC Westgard, Clinical symptoms, Nursing monitor, Pharmacy mechanism/lab interference, GST connection.
- Coverage: MLS (Micro, Parasito, Haem & Transfusion, Chem Path, Histo, Cyto, Immunology, Virology, Mycology, Bacteriology, Molecular, Lab Mgt, QC/QA, Biosafety), Nursing, Anatomy, Physiology, Patho, Pharm, Public Health, Biochem, Pharmacy (dosage, IV rates, drug-lab), Sciences (Bio, Chem, Physics, Maths, Biostatistics, C1V1, eGFR, MCV, MCH, Osmolality, Henderson-Hasselbalch, Sensitivity/Specificity, CFU, Dilutions), GST 111/112/113/211/212, Research, MLSCN 1st & 2nd Professional, CBT, Viva.
- Add-ups: **CGPA Booster:** 4-6 marks, **Recall Cue:** mnemonic, **CBT Speed Trick:** 10-sec elimination.

CGPA - ONLY WHEN ASKED - INSTITUTION-AWARE 2026/2027:
Ask institution if not given. Use:
- University 5.0 (90% NUC): 70-100 A=5, 60-69 B=4, 50-59 C=3, 45-49 D=2, 40-44 E=1, 0-39 F=0. GPA=Σ(GP*Unit)/ΣUnits. Class: 4.50-5.00 First, 3.50-4.49 2:1, 2.40-3.49 2:2
- University 4.0: 70=A=4.0, 60=B=3.0, 50=C=2.0, 45=D=1.0
- Polytechnic NBTE 4.0: 75-100 A=4.00 Distinction, 70-74 AB=3.50, 65-69 B=3.25 Upper, 60-64 BC=3.00, 55-59 C=2.75 Lower, 50-54 CD=2.50, 45-49 D=2.00 Pass
Show markdown table, interpret, upgrade strategy with exact numbers. Say "Using latest NUC/NBTE 2026/2027 approved grading as of 2026".

Style: Hook "Great topic to help you ace this academic session 2026/2027." Then ### sections with bold labels. 350-500 words full, shorter for quick. Trustworthy pro. Year 2026/2027.
`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") return res.status(200).json({ status: "TRUST MLS AI - Precise 2026/2027 - Live", memory: "10 msgs active", functions: ["Text", "Vision Upload Reader", "CGPA"] });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { message, history, imageBase64 } = req.body || {};
    let userMessage = (message || "").toString().trim();
    const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
    const expanded = expandShortInput(userMessage, safeHistory);
    const finalUserMessage = expanded || (imageBase64 ? "Read this uploaded study material for academic session 2026/2027. Explain Opera/ChatGPT bold structured: simple meaning & breaking terms, why deep mechanism, Nitrogen zigzag real life, lab/clinical/nursing/pharmacy only if relevant, exam trap bold + CBT trick, correction per 2026/2027, recall cue, CGPA booster, trustworthy." : "");
    if (!finalUserMessage && !imageBase64) return res.status(400).json({ error: "Message required" });
    if (isHarmful(finalUserMessage)) return res.json({ reply: "Let's stay focused on this academic session 2026/2027 💎 I cover **MLS**, **Nursing**, **Pharmacy**, **GST**, **CGPA** — What shall we master?" });
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY missing" });

    let systemContent = SYSTEM_PROMPT;
    if (isGreeting(userMessage)) {
      systemContent = SYSTEM_PROMPT + "\nGREETING FORMAT EXACT:\n**Hello, MLS Scholar 👋**\n\nWelcome to **TRUST MLS AI** — your Senior Lecturer and Mentor, here to help you ace this academic session **2026/2027**.\n\nI explain from **first principles**, highlight **Exam Traps 💣**, **CBT speed tricks**, **recall cues**, read your **uploaded study images or documents**, and calculate **CGPA per official NUC/NBTE 2026/2027 formula**.\n\nI cover **MLS** 🔬, **Nursing** 🩺, **Pharmacy** 💊, **Sciences**, **GST** 📚.\n\n**How would you like to start?**\n1. Explain a topic deeply\n2. Quick revision + exam traps\n3. Calculate your CGPA for this session\n\nTell me your **level (100L-500L)** and topic. **Stay focused**, let's work on your CGPA together for this session. 💎";
    } else if (isCGPARequest(userMessage)) {
      systemContent = SYSTEM_PROMPT + "\nCGPA MODE: Ask institution if not given. Use official 2026/2027 scale, show markdown table, interpret, upgrade numbers.";
    }

    const messages = [{ role: "system", content: systemContent }, ...safeHistory, { role: "user", content: finalUserMessage }];
    let replyText = await groqCall(apiKey, messages, imageBase64);
    replyText = replyText.trim();
    if (!replyText) replyText = "**Hello, MLS Scholar 👋** Welcome to **TRUST MLS AI**, here to help you ace this academic session **2026/2027**. Tell me your level and topic. 💎";
    return res.json({ reply: replyText, success: true });
  } catch (err) {
    const msg = err.message === "RATE_LIMIT" ? "**Free limit for 30s** ⏳ Wait 30s and retry. **Stay focused** — we continue for **2026/2027**. 💎" : `**Brief pause** 💎 Tap Retry — Detail: ${err.message}`;
    return res.status(200).json({ reply: msg, success: false });
  }
}
