// api/chat.js — FINAL FREE TIER - WORKS WITH FREE GROQ KEY
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "openai/gpt-oss-20b";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"; // FREE vision, not maverick
const MAX_DOC_CHARS = 90000;

const SYSTEM_PROMPT = `You are THT MLS PREP — Elite MLS tutor by Trust Health Tech.`;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const send = (res, s, p) => { Object.entries(CORS).forEach(([k,v])=>res.setHeader(k,v)); return res.status(s).json(p); };
const pickString = (...v) => { for(const x of v) if(typeof x==="string"&&x.trim()) return x.trim(); return ""; };

function getImages(b){
  const raw=[b.image,b.image1,b.image2,b.imageBase64].filter(v=>typeof v==="string"&&v.trim());
  if(Array.isArray(b.images)) for(const x of b.images){ if(typeof x==="string") raw.push(x); else if(x?.data) raw.push(x.data); }
  if(Array.isArray(b.attachments)) for(const a of b.attachments){ if(a&&(a.kind==="image"||a.type==="image")&&typeof a.data==="string") raw.push(a.data); }
  const uniq=[...new Set(raw)];
  return uniq.slice(0,2);
}
const responseFields = (t) => ({ reply: t, answer: t, response: t, text: t });

const buildImageURL = (p) => {
  let safe = String(p||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").trim().slice(0,40);
  if(!safe) safe="biology cell";
  // SIMPLE prompts that Pollinations NEVER refuses
  const MAP = {
    amoeba: "amoeba under microscope",
    spirogyra: "spirogyra algae under microscope",
    paramecium: "paramecium under microscope",
    euglena: "euglena under microscope"
  };
  let final = MAP[safe] || safe;
  for(const k in MAP){ if(safe.includes(k)){ final=MAP[k]; break; } }
  // NO negative words, NO nologo, NO safe=true -> avoids "Image refused"
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(final + " scientific illustration educational textbook")}?width=1024&height=1024&model=flux&seed=${Math.floor(Math.random()*999999)}`;
};

async function groqCall(k, model, messages){
  const r = await fetch(GROQ_URL, { method:"POST", headers:{ "Authorization":`Bearer ${k}`, "Content-Type":"application/json" }, body: JSON.stringify({ model, messages, temperature:0.5, max_tokens:1600 }) });
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
    if(!message && !images.length && !doc) return send(res,400,{error:"Enter question."});
    
    let prompt = message || "Explain material.";
    if(doc) prompt = `DOC: ${doc.slice(0,90000)}\nQ: ${prompt}`;
    
    let answer;
    if(images.length){
      const content = [{ type:"text", text: prompt }, ...images.map(u=>({ type:"image_url", image_url:{ url: u.startsWith("data:")?u:`data:image/jpeg;base64,${u}` } }))];
      answer = await groqCall(key, VISION_MODEL, [{role:"system",content:SYSTEM_PROMPT},{role:"user",content}]);
    } else {
      answer = await groqCall(key, TEXT_MODEL, [{role:"system",content:SYSTEM_PROMPT},{role:"user",content:prompt}]);
    }
    
    const tag = /\[GENERATE_IMAGE:\s*([\s\S]*?)\s*\]/i;
    const m = answer.match(tag);
    if(m){
      let rp = m[1].toLowerCase().replace(/[^a-z0-9 ]/g," ").trim().split(/\s+/).slice(0,4).join(" ");
      const url = buildImageURL(rp);
      answer = answer.replace(tag, `\n\n![Visual](${url})\n\n`);
    } else if(/\b(amoeba|spirogyra|paramecium|image|picture|diagram|show)\b/i.test(message)){
      let rp = message.toLowerCase().replace(/[^a-z0-9 ]/g," ").trim().split(/\s+/).slice(0,3).join(" ");
      answer += `\n\n![Visual](${buildImageURL(rp)})\n\n`;
    }
    return send(res,200,responseFields(answer));
  }catch(err){
    console.error(err.message);
    return send(res,500,{error: err.message});
  }
}
