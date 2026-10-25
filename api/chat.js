// api/chat.js — THT MLS TUTOR EDITION - REAL HUMAN VOICE - FREE KEY
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "openai/gpt-oss-20b";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `You are THT MLS PREP — Senior MLS Tutor & Exam Guide. You are Trust Health Tech's top MLS lecturer with 15 years of lab + CBT marking experience. You talk like a REAL human senior colleague, not AI.

YOUR VOICE:
- Warm, direct, encouraging, like a senior who wants the junior to PASS
- You say "Listen," "Look," "My dear scholar," "This is where they trap you"
- You never sound robotic. You explain like you're in lab with the student.

YOUR SCOPE: MLS, Medical Lab Science, Health Education, THT platform only.

YOUR TEACHING FORMAT (Always use for academic questions):
🔬 TOPIC: [What this is - in one simple line]

📖 IN SIMPLE TERMS:
[Explain like you're teaching in lab, 2-3 lines, no big grammar]

✅ WHAT YOU MUST KNOW FOR EXAM:
- [3-4 bullet points that actually come in CBT]

🧠 MLS EXAM TRAP (Where students fail):
[1 real trap you have seen students fail]

💡 MY MNEMONIC / LAB HACK:
[One memory trick you use in lab]

⚡ CBT SPEED TIP:
[How to answer this in under 20 seconds]

⚠️ COMMON MISTAKE I SEE:
[1 mistake]

🎯 TUTOR'S ADVICE:
[One line motivation/guidance - e.g., "Don't cram this, draw it once and you'll never forget."]

For greetings like "hi", "hello", "thanks" — be warm and short: "Hello my MLS Scholar! 👋 Ready to smash some concepts today? Ask me anything — lab, theory, or upload your note."

For image requests: Add at end [GENERATE_IMAGE: single keyword like amoeba, spirogyra, paramecium] - keep it ONE word.

Never say "as an AI". You are Senior MLS Tutor from THT.
`;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const send = (res,s,p)=>{ Object.entries(CORS).forEach(([k,v])=>res.setHeader(k,v)); return res.status(s).json(p); };
const pickString = (...v)=>{ for(const x of v) if(typeof x==="string"&&x.trim()) return x.trim(); return ""; };

function getImages(b){
  const raw=[b.image,b.image1,b.image2,b.imageBase64].filter(v=>typeof v==="string"&&v.trim());
  if(Array.isArray(b.images)) for(const x of b.images){ if(typeof x==="string") raw.push(x); else if(x?.data) raw.push(x.data); }
  return [...new Set(raw)].slice(0,2);
}
const responseFields = (t) => ({ reply: t, answer: t, response: t, text: t });

// REAL IMAGES - No AI hallucination for biology
const REAL_IMAGES = {
  spirogyra: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Spirogyra.jpg/800px-Spirogyra.jpg",
  amoeba: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Amoeba_proteus.jpg/800px-Amoeba_proteus.jpg",
  paramecium: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Paramecium.jpg/800px-Paramecium.jpg",
  euglena: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Euglena.jpg/800px-Euglena.jpg",
  plasmodium: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Plasmodium_falciparum.jpg/800px-Plasmodium_falciparum.jpg",
  rbc: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Red_Blood_Cells.jpg/800px-Red_Blood_Cells.jpg",
  wbc: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/White_blood_cells.jpg/800px-White_blood_cells.jpg"
};

const buildImageURL = (p) => {
  let safe = String(p||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").trim();
  for(const k in REAL_IMAGES){
    if(safe.includes(k)) return REAL_IMAGES[k] + `?v=${Date.now()}`;
  }
  let q = safe.slice(0,30) || "medical laboratory";
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(q + " medical illustration")}?width=1024&height=1024&model=flux&seed=${Math.floor(Math.random()*99999)}`;
};

async function groqCall(k, model, messages){
  const r = await fetch(GROQ_URL, { method:"POST", headers:{ "Authorization":`Bearer ${k}`, "Content-Type":"application/json" }, body: JSON.stringify({ model, messages, temperature:0.65, max_tokens:1800 }) });
  const data = await r.json().catch(()=>({}));
  if(!r.ok){ throw new Error(data?.error?.message || `Groq ${r.status}`); }
  return data?.choices?.[0]?.message?.content?.trim() || "No answer.";
}

export default async function handler(req,res){
  Object.entries(CORS).forEach(([k,v])=>res.setHeader(k,v));
  if(req.method==="OPTIONS") return res.status(204).end();
  if(req.method!=="POST") return send(res,405,{error:"Method not allowed."});
  try{
    let body=req.body; if(typeof body==="string") body=JSON.parse(body);
    const message = pickString(body.message, body.prompt, body.question, body.text);
    const images = getImages(body);
    const doc = pickString(body.extractedText, body.docText);
    const key = process.env.GROQ_API_KEY;
    if(!key) return send(res,500,{error:"GROQ_API_KEY missing."});
    
    let prompt = message || "Explain material.";
    if(doc) prompt = `STUDENT NOTE:\n${doc.slice(0,80000)}\n\nSTUDENT QUESTION: ${prompt}\n\nExplain like senior tutor, guide them.`;
    
    let answer;
    if(images.length){
      const content = [{ type:"text", text: prompt + "\nExplain like a real MLS senior tutor guiding a junior. Be warm, practical." }, ...images.map(u=>({ type:"image_url", image_url:{ url: u.startsWith("data:")?u:`data:image/jpeg;base64,${u}` } }))];
      answer = await groqCall(key, VISION_MODEL, [{role:"system",content:SYSTEM_PROMPT},{role:"user",content}]);
    } else {
      answer = await groqCall(key, TEXT_MODEL, [{role:"system",content:SYSTEM_PROMPT},{role:"user",content:prompt}]);
    }
    
    const tag = /\[GENERATE_IMAGE:\s*([\s\S]*?)\s*\]/i;
    const m = answer.match(tag);
    if(m){
      let rp = m[1].toLowerCase().replace(/[^a-z0-9 ]/g," ").trim();
      const url = buildImageURL(rp);
      answer = answer.replace(tag, `\n\n![Visual](${url})\n\n*Look at this well — this is what you will see under microscope in exam.*`);
    } else if(/\b(spirogyra|amoeba|paramecium|euglena|plasmodium|show image|image of)\b/i.test(message)){
      let rp = message.toLowerCase().replace(/[^a-z0-9 ]/g," ").trim();
      answer += `\n\n![Visual](${buildImageURL(rp)})\n\n*My dear, study this image well — examiners love this one.*`;
    }
    return send(res,200,responseFields(answer));
  }catch(err){
    return send(res,500,{error: err.message});
  }
    }
