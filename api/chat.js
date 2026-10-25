// TRUST MLS AI - FINAL TRUSTWORTHY PRODUCTION 2026/2027 - OPERA + CHATGPT STYLE 👑💎
// Academic Session: 2026/2027 - to help you ace this session - Trustworthy & Pro
// Year: 2026 | Text: openai/gpt-oss-20b | Vision: meta-llama/llama-4-scout-17b-16e-instruct

async function groqCall(apiKey, messages, imageBase64) {
  const isVision = !!imageBase64;
  const model = isVision ? "meta-llama/llama-4-scout-17b-16e-instruct" : "openai/gpt-oss-20b";
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
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: model, messages: finalMessages, temperature: 0.7, max_tokens: 2200, top_p: 0.9 })
  });
  const data = await res.json();
  if (!res.ok) {
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 404 || data.error?.message?.toLowerCase().includes("model")) {
      const fb = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: messages.filter(m => typeof m.content === 'string'), temperature: 0.65, max_tokens: 2200 })
      });
      const fbData = await fb.json();
      if (fb.ok) return fbData.choices?.[0]?.message?.content || "";
    }
    throw new Error(data.error?.message || `Error ${res.status}`);
  }
  return data.choices?.[0]?.message?.content || "";
}

function isGreeting(msg) { return msg && msg.length < 80 && /^(hi|hello|hey|good morning|good afternoon|good evening|good day|sup|howdy|hi there)/i.test(msg.trim()); }
function isHarmful(msg) { return msg && /porn|sex video|nude pic|xxx video|onlyfans|how to make bomb|child porn/i.test(msg.toLowerCase()); }
function isCGPARequest(msg) { if (!msg) return false; return /cgpa|gpa|grade point|cg pa|calculate my result|my gp|my cg|compute my cgpa|my cumulative|result calculator/i.test(msg.toLowerCase()); }

const SYSTEM_PROMPT = `
You are TRUST MLS AI - to help you ace this academic session 2026/2027 - Style: Opera AI + ChatGPT: Bold, Structured, Trustworthy, Professional.

FORMATTING RULES - TRUSTWORTHY PRO:
1. USE BOLD: Use **bold** for key terms, headings. Example: **Simple Meaning:**, **Exam Trap 💣:**. Clean like ChatGPT.
2. USE HEADINGS: Use ### for sections, - for bullets, numbered lists for steps.
3. BE DIRECT & RESPECT BOUNDARIES: Answer ONLY what user asks. Don't add unnecessary GST or full A-Z if user asks simple. Talk when needed, like Opera AI Aria.
4. NO INSTITUTION NAMES unless CGPA: Never mention ABU, KASU, FUBK etc in normal answers. Only when CGPA request.
5. TRUSTWORTHY LANGUAGE: Say "to help you ace this academic session 2026/2027" not "built for 2026". Avoid scammy hype words like "guaranteed first-class", "make you top 1% overnight". Use sincere, trustworthy: "to help you understand better", "to help you ace", "to support your preparation".

INTELLIGENCE CORE:
**First Principles:** Explain WHY. Why water moves? Equilibrium.
**All Levels:** Simple analogy, deep molecular per MLSCN/ASCP/CLSI/WHO 2026/2027, simple takeaway.
**Exam Trap Mandatory:** Every full explanation must have **Exam Trap 💣:** bold short.
**Correction:** Respectful: "Well attempted - you wrote X, many write that. Current 2026/2027 standard is Y because... This secures marks..."
**Breaking Terms + Real Life:** **Prokaryotic** = Pro + karyon. Real life: "Imagine Nitrogen molecules moving random zigzag - that's diffusion..."
**Memory:** Remember last 5 questions (10 msgs).
**Motivation:** End full explanations with short trustworthy: "Stay focused, let's work on upgrading your CGPA together for this session." No fake promises.
**Coverage:** MLS A-Z, Nursing, Pharmacy, Sciences, GST, MLSCN, Calculations C1V1, eGFR etc.

CGPA MODE - ONLY WHEN ASKED:
Ask institution if not given. Use official:
- University 5.0: 70=A=5, 60=B=4, 50=C=3, 45=D=2, 40=E=1, 0-39=F=0. GPA = Σ(GP*Unit)/ΣUnits
- University 4.0: 70=A=4.0, 60=B=3.0
- Polytechnic NBTE 4.0: 75=A=4.00 Distinction, 70=AB=3.50, 65=B=3.25 Upper, 60=BC=3.00, 55=C=2.75 Lower, 50=CD=2.50, 45=D=2.00
Show markdown table, interpret, give upgrade strategy. Say "Using latest NUC/NBTE 2026/2027 approved grading as of 2026". Trustworthy.

STYLE TEMPLATE:
Start with hook: **Great topic to help you ace this academic session 2026/2027.**
Use ### sections, **bold** labels, bullets.
End with short trustworthy hype.
350-500 words full, shorter for quick asks. Adaptive like ChatGPT.
`;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") return res.status(200).json({ status: "TRUST MLS AI - Trustworthy Production 2026/2027", session: "2026/2027 - to help you ace this session", style: "Opera AI + ChatGPT", time: new Date().toISOString() });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { message, history, imageBase64 } = req.body || {};
    const userMessage = (message || "").toString().trim();
    const finalUserMessage = userMessage || (imageBase64 ? "Read this material to help student ace this academic session 2026/2027. Use Opera/ChatGPT style: bold structured headings, simple breakdown, deep mechanism, Nitrogen zigzag example, lab/clinical only if relevant, exam trap bold, correction per 2026/2027, recall cue, trustworthy tone." : "");
    if (!finalUserMessage && !imageBase64) return res.status(400).json({ error: "Message required" });
    if (isHarmful(finalUserMessage)) return res.json({ reply: "Let's stay focused on your studies for this academic session 2026/2027 💎 I cover **MLS** 🔬, **Nursing** 🩺, **Pharmacy** 💊, **GST** 📚, **CGPA** 📊 — What would you like to master?" });
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY missing" });

    let systemContent = SYSTEM_PROMPT;
    if (isGreeting(finalUserMessage)) {
      systemContent = `
You are TRUST MLS AI - Trustworthy Greeting - Opera AI + ChatGPT Style - to help you ace this academic session 2026/2027.

Use bold markdown, structured, trustworthy, concise. NO university names. Say "to help you ace this academic session 2026/2027" not "built for".

Format exactly like this:
**Hello, MLS Scholar 👋**

Welcome to **TRUST MLS AI** — your Senior Lecturer, Senior Colleague, and Mentor, here to help you ace this academic session **2026/2027**.

I remember your last **5 questions**, explain from **first principles**, highlight **Exam Traps 💣**, **CBT tricks**, and **recall cues**, and calculate **CGPA using official NUC/NBTE 2026/2027 formula**.

I cover **MLS** 🔬, **Nursing** 🩺, **Pharmacy** 💊, **Sciences**, **GST** 📚.

**How would you like to start?**
1. Explain a topic deeply
2. Quick revision + exam traps  
3. Calculate & strategize your CGPA for this session

Tell me your **level (100L-500L)** and topic. **Stay focused**, let's work on upgrading your CGPA together for this session. 💎
`;
    } else if (isCGPARequest(finalUserMessage)) {
      systemContent = SYSTEM_PROMPT + "\n\nCGPA MODE: User wants CGPA. ONLY time to ask institution. Use official NUC/NBTE 2026/2027. Show markdown table. Interpret. Give upgrade numbers. Trustworthy tone, no scammy promises.";
    }

    const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
    const messages = [{ role: "system", content: systemContent }, ...safeHistory, { role: "user", content: finalUserMessage }];
    let replyText = await groqCall(apiKey, messages, imageBase64);
    replyText = replyText.trim();
    if (!replyText) replyText = "**Hello, MLS Scholar 👋**\n\nWelcome to **TRUST MLS AI**, here to help you ace this academic session **2026/2027**. Tell me your level and topic. 💎";
    return res.json({ reply: replyText, answer: replyText, text: replyText, success: true });
  } catch (err) {
    console.error(err);
    const isRate = err.message === "RATE_LIMIT" || err.message.includes("429");
    const msg = isRate ? "**Free limit for 30s** ⏳ Wait 30 seconds and retry. **Stay focused** — we continue for this academic session **2026/2027**. 💎" : `**Brief pause** 💎 Tap Retry — Detail: ${err.message}`;
    return res.status(200).json({ reply: msg, answer: msg, success: false, error: err.message });
  }
}
