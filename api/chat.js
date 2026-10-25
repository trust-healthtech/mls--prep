// api/chat.js — FINAL PRO LIGHT — 70 lines — Imports images
import { REAL_IMAGES } from "./realimages.js";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "openai/gpt-oss-20b";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const SYSTEM_PROMPT = `You are THT MLS Senior Tutor for MLSCN Nigeria. Real human senior lecturer. Warm, direct. DO NOT use **, *, -, #, markdown. Clean plain text only. FORMAT: 🔬 TOPIC, 📖 SIMPLE EXPLANATION, ✅ WHAT YOU MUST KNOW FOR MLSCN EXAM, 🧠 EXAM TRAP, 💡 CLINICAL LAB HACK, ⚡ CBT SPEED TIP, 🎯 TUTORS ADVICE. End with [IMAGE: keyword]`;
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const send = (res,s,p)=>{ for(let k in CORS) res.setHeader(k,CORS[k]); return res.status(s).json(p); };
const pickString = (...v)=>{ for(let x of v) if(typeof x==="string"&&x.trim()) return x.trim(); return ""; };
function getImages(b){ const raw=[b.image,b.image1,b.image2,b.imageBase64].filter(v=>typeof v==="string"&&v.trim()); return [...new Set(raw)].slice(0,2); }
const buildImageURL = (p) => {
  let safe = String(p||"").toLowerCase().replace(/[^a-z0-9 ]/g," ").trim();
  safe = safe.replace("spirogira","spirogyra");
  for(const k in REAL_IMAGES){ if(safe.includes(k)) return REAL_IMAGES[k]; }
  return null;
};
async function groqCall(k, model, messages){
  const r = await fetch(GROQ_URL, { method:"POST", headers:{ "Authorization":`Bearer ${k}`, "Content-Type":"application/json" }, body: JSON.stringify({ model, messages, temperature:0.6, max_tokens:1500 }) });
  const data = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data?.error?.message || `Groq ${r.status}`);
  return data?.choices?.[0]?.message?.content?.trim() || "No answer.";
}
export default async function handler(req,res){
  for(let k in CORS) res.setHeader(k,CORS[k]);
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
    if(doc) prompt = `Note: ${doc.slice(0,60000)} Question: ${prompt}`;
    let answer = images.length ? await groqCall(key, VISION_MODEL, [{role:"system",content:SYSTEM_PROMPT},{role:"user",content:prompt}]) : await groqCall(key, TEXT_MODEL, [{role:"system",content:SYSTEM_PROMPT},{role:"user",content:prompt}]);
    answer = answer.replace(/\*\*/g,"").replace(/\*/g,"").replace(/##/g,"");
    let imageUrl = null;
    const m = answer.match(/\[IMAGE:\s*([a-zA-Z0-9_ ]+)\s*\]/i);
    let requested = message;
    if(m){ requested=m[1]; imageUrl=buildImageURL(m[1]); answer=answer.replace(/\[IMAGE:[^\]]+\]/i,"").trim(); } else { imageUrl=buildImageURL(message); }
    if(!imageUrl && /(image|picture|show|egg|stain|smear)/i.test(message)){ console.warn("MISSING_IMAGE_LOG: "+requested+" | "+message); }
    answer = answer.replace(/\[Visual\]/gi,"").replace(/\(https:\/\/[^\)]+\)/g,"").trim();
    return send(res,200,{ reply: answer, answer, text: answer, image: imageUrl, imageUrl, visual: imageUrl });
  }catch(err){ return send(res,500,{error: err.message}); }
}
