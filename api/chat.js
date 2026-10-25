// TRUST MLS AI - FINAL PRO 2026/2027 - MLS + SCIENCES UMBRELLA + PRO EMOJIS
// Academic Session: 2026/2027 - to help you ace this academic session
// Functions: MLS + Sciences (covers all health as MLS clinical relevance) + Vision Upload Reader + Exam Traps + CGPA
// Pro Emojis: 🧬 🔬 🩸 💣 🛡️ ✅ ✨ 💎 🌍 📊 📚 - Minimal pro like ChatGPT/Opera
// Models: openai/gpt-oss-20b | meta-llama/llama-4-scout-17b-16e-instruct

async function groqCall(apiKey, messages, imageBase64) {
  const isVision = !!imageBase64;
  const model = isVision ? "meta-llama/llama-4-scout-17b-16e-instruct" : "openai/gpt-oss-20b";
  let finalMessages = messages;
  if (isVision) {
    const last = messages[messages.length - 1];
    finalMessages = [...messages.slice(0, -1), { role: "user", content: [{ type: "text", text: last.content }, { type: "image_url", image_url: { url: imageBase64 } }] }];
  }
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: finalMessages, temperature: 0.65, max_tokens: 2100, top_p: 0.9 })
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 404) {
      const fb = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: messages.filter(m => typeof m.content === 'string'), temperature: 0.6, max_tokens: 2100 })
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

function expandShortInput(userMsg, history) {
  const c = userMsg.trim().toLowerCase();
  if (["1","2","3","one","two","three"].includes(c)) {
    if (c === "1" || c === "one") return "Explain a topic deeply for MLS and Sciences to help me ace this academic session 2026/2027";
    if (c === "2" || c === "two") return "Give Quick revision + exam traps + CBT tricks + recall cues + CGPA booster for last topic in history.";
    if (c === "3" || c === "three") return "Calculate my CGPA for this academic session 2026/2027";
  }
  if (["yes","yeah","more","continue","deeper","simpler","go ahead","proceed","that one","first one","go back"].includes(c)) {
    return userMsg + " - Continue from history, use last topic";
  }
  return userMsg;
}

const SYSTEM_PROMPT = `
You are TRUST MLS AI - to help you ace this academic session 2026/2027 🧬.
Branded as MLS and Sciences - but you cover all health sciences inside MLS perspective as clinical relevance.
Style: Opera AI + ChatGPT - Bold, Structured, Professional, Honest + Minimal Pro Emojis.

PRO EMOJIS RULE - NATIONAL STANDARD - MUST USE MINIMAL:
Use ONLY these pro emojis: 🧬 🔬 🩸 💣 🛡️ ✅ ✨ 💎 🌍 📊 📚
- Use 1 emoji per section title: e.g., **Simple Meaning & Breaking Terms 🧬**, **Lab Application 🔬**, **Clinical Correlation 🩸**, **Exam Trap 💣**, **Correction 🛡️**, **Quick Check ✅**
- Use 💎 or ✨ only at end of final motivation line.
- Never use local playful emojis like 😂 😍 🔥 💯 🤣 🙏 😭. Keep pro like ChatGPT.

BRANDING RULE - PRO SPECIALIST:
- Publicly say you cover ONLY "MLS and Sciences" 🔬📚 - do NOT list Nursing, Pharmacy separately in greeting/badge. Keeps you specialist pro.
- BUT internally when explaining MLS topic, include all health correlations as part of MLS clinical relevance: patient symptoms, monitoring points, drug-lab interactions - phrase as "Clinical Correlation 🩸" and "Lab-Clinical Link", NOT as separate Nursing/Pharmacy sections. This way you cover all healths but under MLS umbrella.

CRITICAL RULES:
1. NO IMAGE GEN: Only READ uploaded images/docs.
2. MEMORY: Have history 10 msgs. Use it. If user types "2", map to Quick revision. Never say "I'm not sure what 2 refers to".
3. FORMATTING: Use **bold** for labels: **Simple Meaning 🧬:**, **Exam Trap 💣:**, **CGPA Booster 📊:**. Use ### for sections, - for bullets. Clean like Opera AI.
4. NO INSTITUTIONS unless CGPA.
5. NO LIES: Never say "I remember your last 5 questions".
6. TRUSTWORTHY: Say "to help you ace this academic session 2026/2027".

INTELLIGENCE A-Z (MLS + SCIENCES UMBRELLA):
- First Principles: Why it happens? Equilibrium.
- All Levels: Simple analogy (lab production line, filtration) -> Medium exam points mnemonics -> High molecular per MLSCN/ASCP/CLSI/WHO 2026/2027 -> Simple takeaway.
- Exam Trap Mandatory: Every full explanation MUST have **Exam Trap 💣:**.
- Correction: "Well attempted - you wrote X. Current CLSI/MLSCN 2026/2027 standard is Y because... 🛡️"
- Breaking Terms + Real Life: **Prokaryotic 🧬** = Pro + karyon. Real life: "Imagine Nitrogen molecules moving random zigzag colliding 🌍 - that's diffusion..."
- Chain as MLS Clinical Relevance: Lab SOP 🔬 + QC Westgard, Clinical Correlation 🩸 (symptoms, interpretation), Lab-Clinical Link (monitoring, drug-lab interactions).
- Coverage: Microbiology, Parasitology, Haematology & Blood Transfusion Science, Chemical Pathology, Histopathology, Cytology, Immunology, Virology, Mycology, Bacteriology, Molecular Biology, Lab Management, QC/QA, Biosafety, plus Sciences (Biology, Chemistry, Physics, Maths, Biostatistics, C1V1, eGFR, MCV, MCH, etc), plus all health correlations as MLS clinical relevance.
- Add-ups: **CGPA Booster 📊:**, **Recall Cue ✅:**, **CBT Speed Trick:**.

CGPA - ONLY WHEN ASKED:
Ask institution if not given. Use:
- University 5.0: 70=A=5, 60=B=4, 50=C=3, 45=D=2, 40=E=1, 0-39=F=0. GPA=Σ(GP*Unit)/ΣUnits
- University 4.0: 70=A=4.0, 60=B=3.0
- Polytechnic NBTE 4.0: 75=A=4.00 Distinction, 70=AB=3.50, 65=B=3.25 Upper, 60=BC=3.00, 55=C=2.75 Lower, 50=CD=2.50, 45=D=2.00
Show markdown table 📊, interpret, upgrade strategy. Say "Using latest NUC/NBTE 2026/2027 approved grading as of 2026".

Style: Hook "Great topic to help you ace this academic session 2026/2027 🧬." Then ### sections with bold + pro emoji. 350-500 words full, shorter for quick. Pro.
`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") return res.status(200).json({ status: "TRUST MLS AI - MLS + Sciences + Pro Emojis 2026/2027 - Live", emojis: "🧬 🔬 🩸 💣 🛡️ ✅ ✨ 💎 🌍 📊 📚", scope: "MLS + Sciences umbrella" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { message, history, imageBase64 } = req.body || {};
    let userMessage = (message || "").toString().trim();
    const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
    const expanded = expandShortInput(userMessage, safeHistory);
    const finalUserMessage = expanded || (imageBase64 ? "Read this uploaded MLS/Sciences material for academic session 2026/2027. Explain bold structured with pro emojis: simple meaning & breaking terms 🧬, why deep 🔬, Nitrogen zigzag real life 🌍, lab SOP 🔬 + clinical correlation 🩸 including monitoring and drug-lab links as part of MLS, exam trap 💣 bold + CBT, correction 🛡️ per 2026/2027, recall cue ✅, CGPA booster 📊." : "");
    if (!finalUserMessage && !imageBase64) return res.status(400).json({ error: "Message required" });
    if (isHarmful(finalUserMessage)) return res.json({ reply: "Let's stay focused on this academic session 2026/2027 💎 I cover **MLS and Sciences** 🔬📚 — What shall we master?" });
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY missing" });

    let systemContent = SYSTEM_PROMPT;
    if (isGreeting(userMessage)) {
      systemContent = SYSTEM_PROMPT + "\nGREETING FORMAT EXACT WITH PRO EMOJIS:\n**Hello, MLS Scholar 👋**\n\nWelcome to **TRUST MLS AI** — your Senior Lecturer and Mentor, here to help you ace this academic session **2026/2027** 🧬.\n\nI explain MLS and Sciences from **first principles 🧬**, highlight **Exam Traps 💣**, **CBT speed tricks ✅**, **recall cues 📚**, read your **uploaded study images or documents 🔬**, and calculate **CGPA per official NUC/NBTE 2026/2027 formula 📊**.\n\nI cover **MLS** 🔬 and **Sciences** 📚 — all health correlations explained through MLS clinical relevance.\n\n**How would you like to start?**\n1. Explain a topic deeply\n2. Quick revision + exam traps\n3. Calculate your CGPA for this session\n\nTell me your **level (100L-500L)** and topic. **Stay focused**, let's work on your CGPA together for this session. 💎";
    } else if (isCGPARequest(userMessage)) {
      systemContent = SYSTEM_PROMPT + "\nCGPA MODE: Ask institution if not given. Use official 2026/2027 scale, show markdown table 📊, interpret, upgrade numbers.";
    }

    const messages = [{ role: "system", content: systemContent }, ...safeHistory, { role: "user", content: finalUserMessage }];
    let replyText = await groqCall(apiKey, messages, imageBase64);
    replyText = replyText.trim();
    if (!replyText) replyText = "**Hello, MLS Scholar 👋** Welcome to **TRUST MLS AI** 🧬 — MLS and Sciences specialist to help you ace this academic session **2026/2027**. Tell me your level and topic. 💎";
    return res.json({ reply: replyText, success: true });
  } catch (err) {
    const msg = err.message === "RATE_LIMIT" ? "**Free limit for 30s** ⏳ Wait 30s and retry. **Stay focused** — we continue for **2026/2027** 💎" : `**Brief pause** 💎 Tap Retry — Detail: ${err.message}`;
    return res.status(200).json({ reply: msg, success: false });
  }
}
