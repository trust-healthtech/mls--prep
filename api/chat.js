// api/chat.js — CLEAN MLS TUTOR EDITION - NO MARKDOWN - REAL IMAGES
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "openai/gpt-oss-20b";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `You are THT MLS Senior Tutor. Talk like a real human senior MLS lecturer.

RULES - VERY IMPORTANT:
- DO NOT use **, *, -, +, /, # or markdown at all. No bold, no stars, no dashes.
- Write clean plain text only. Clean background for learning.
- Use line breaks and emojis for sections, but no markdown symbols.
- Be warm, direct, like a senior colleague guiding a junior to pass.

FOR ACADEMIC QUESTIONS, USE THIS CLEAN FORMAT:

🔬 TOPIC: Spirogyra

📖 SIMPLE EXPLANATION:
[2 to 3 simple lines, lab style]

✅ WHAT YOU MUST KNOW FOR EXAM:
Habitat: Freshwater lakes and ponds
Morphology: Filamentous single row cells with spiral chloroplast
Reproduction: Asexual by transverse division, sexual by conjugation
Ecology: Primary producer, part of phytoplankton

🧠 EXAM TRAP:
Students confuse spiral chloroplast of Spirogyra with general Chlorophyta. Spiral shape is diagnostic.

💡 LAB HACK:
Think Spiral means Spirogyra. S for Spiral.

⚡ CBT SPEED TIP:
Answer in 20 seconds: Freshwater filamentous green algae with spiral chloroplast, reproduces by conjugation.

⚠️ COMMON MISTAKE:
Forgetting pyrenoid is inside chloroplast.

🎯 TUTORS ADVICE:
Draw the spiral once, you will never forget in exam hall.

For greeting: Just warm short hello.
For image: End with exactly [IMAGE: keyword] where keyword is one word like spirogyra, amoeba.
Example: [IMAGE: spirogyra]
`;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const send = (res,s,p)=>{ Object.entries(CORS).forEach(([k,v])=>res.setHeader(k,v)); return res.status(s).json(p); };
const pickString = (...v)=>{ for(const x of v) if(typeof x==="string"&&x.trim()) return x.trim(); return ""; };

function getImages(b){
  const raw=[b.image,b.image1,b.image2,b.imageBase64].filter(v=>typeof v==="string"&&v.trim());
  return [...new Set(raw)].slice(0,2);
}

const REAL_IMAGES = {
  spirogyra: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Spirogyra.jpg/800px-Spirogyra.jpg",
  amoeba: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Amoeba_proteus.jpg/800px-Amoeba_proteus.jpg",
  paramecium: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Paramecium.jpg/800px-Paramecium.jpg",
  euglena: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Euglena.jpg/800px-Euglena.jpg"
};

const buildImageURL = (p) => {
  let safe = String(p||"").toLowerCase();
  for(const k in REAL_IMAGES){
    if(safe.includes(k)) return REAL_IMAGES[k];
  }
  return null;
};

async function groqCall(k, model, messages){
  const r = await fetch(GROQ_URL, { method:"POST", headers:{ "Authorization":`Bearer ${k}`, "Content-Type":"application/json" }, body: JSON.stringify({ model, messages, temperature:0.6, max_tokens:1500 }) });
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
    
    let prompt = message || "Explain.";
    if(doc) prompt = `Note: ${doc.slice(0,70000)} Question: ${prompt}`;

    let answer;
    if(images.length){
      const content = [{ type:"text", text: prompt }, ...images.map(u=>({ type:"image_url", image_url:{ url: u.startsWith("data:")?u:`data:image/jpeg;base64,${u}` } }))];
      answer = await groqCall(key, VISION_MODEL, [{role:"system",content:SYSTEM_PROMPT},{role:"user",content}]);
    } else {
      answer = await groqCall(key, TEXT_MODEL, [{role:"system",content:SYSTEM_PROMPT},{role:"user",content:prompt}]);
    }

    // Clean any leftover markdown symbols that Groq might still add
    answer = answer.replace(/\*\*/g, "").replace(/\*/g, "").replace(/##/g, "").replace(/###/g, "");
    
    let imageUrl = null;
    const imgTag = /\[IMAGE:\s*([a-zA-Z0-9_ ]+)\s*\]/i;
    const m = answer.match(imgTag);
    if(m){
      imageUrl = buildImageURL(m[1]);
      answer = answer.replace(imgTag, "").trim();
    } else if(/spirogyra|amoeba|paramecium|euglena/i.test(message)){
      imageUrl = buildImageURL(message);
    }

    // Clean extra spaces and brackets
    answer = answer.replace(/\[Visual\]/gi, "").replace(/\(https:\/\/[^\)]+\)/g, "").trim();

    // Return clean JSON with separate image field so frontend renders image properly
    return send(res,200,{
      reply: answer,
      answer: answer,
      text: answer,
      image: imageUrl,
      imageUrl: imageUrl,
      visual: imageUrl
    });

  }catch(err){
    return send(res,500,{error: err.message});
  }
             }
