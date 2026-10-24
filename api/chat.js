// api/chat.js — THT MLS PREP — PRODUCTION READY
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = process.env.GROQ_TEXT_MODEL || "openai/gpt-oss-20b";
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
const MAX_DOC_CHARS = 90000;
const MAX_IMAGE_DATA_URL_CHARS = 1350000;

const SYSTEM_PROMPT = `You are THT MLS PREP — Elite MLS tutor built by Trust Health Tech (THT).

SCOPE: ONLY answer MLS (hematology, microbiology, biochemistry, histopathology, parasitology, immunology, transfusion, lab calculations, QC), medical/health education, and THT platform questions (uploads, how to use THT, bundles, CBT).

If unrelated (football, politics, crypto, music, relationship) say: "I'm THT MLS AI, focused on MLS / medical & health education and THT platform only."

RULES:
- For "Hi", "Should I upload", "What is THT" — answer SHORT, direct, no exam format.
- For MLS academic topics — use PREMIUM FORMAT:
🔬 TOPIC:
[Clear explanation]
✅ KEY POINTS TO KNOW:
💡 MLS EXAM TRAP:
🧠 MNEMONIC / HACK:
⚡ CBT SPEED TIP:
⚠️ COMMON MISTAKE:
- Be accurate. No invented sources. Educational only.
- Visual: Add [GENERATE_IMAGE: concise description] only when illustration helps (cells, parasites, bacteria, histology, equipment).`;

const CORS = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"};
const send=(res,s,p)=>{Object.entries(CORS).forEach(([k,v])=>res.setHeader(k,v));return res.status(s).json(p);};
const pickString=(...v)=>{for(const x of v)if(typeof x==="string"&&x.trim())return x.trim();return "";};

function isAllowed(text){
  const t=(text||"").toLowerCase().trim();
  if(!t) return false;
  if(/^(hi|hello|hey|thanks|thank you|ok)$/i.test(t)) return true;
  if(/(tht|trust health tech|how to upload|should i upload|upload limit|who built|library|bundles|cbt|contact)/i.test(t)) return true;
  if(/(mls|medical lab|hematology|microbiology|biochemistry|histology|parasitology|immunology|transfusion|lab|wbc|rbc|platelet|malaria|parasite|bacteria|culture|stain|microscope|qc|medical|health|anatomy|physiology|disease|infection|sample|calculation)/i.test(t)) return true;
  if(/(football|premier league|bet|politics|president|music|movie|celebrity|relationship|crypto|bitcoin)/i.test(t)) return false;
  return true;
}
function normalizeImage(v,name){
  if(typeof v!=="string"||!v.trim()) return null;
  let d=v.trim();
  if(/^data:image\/(png|jpe?g|webp);base64,/i.test(d)) return d;
  if(/^data:image\/(heic|heif);base64,/i.test(d)) throw new Error("Convert HEIC/HEIF to JPG/PNG before upload.");
  if(/^https?:\/\//i.test(d)) throw new Error("Remote URLs not accepted.");
  if(!/^[A-Za-z0-9+/=\r\n]+$/.test(d)) throw new Error("Unsupported image encoding.");
  const ext=(name||"").toLowerCase();
  const mime=/\.png$/.test(ext)?"image/png":/\.webp$/.test(ext)?"image/webp":"image/jpeg";
  return `data:${mime};base64,${d.replace(/\s/g,"")}`;
}
function getImages(body){
  const raw=[body.image,body.image1,body.image2,body.imageBase64,body.base64Image].filter(v=>typeof v==="string"&&v.trim());
  if(Array.isArray(body.images)) for(const x of body.images){if(typeof x==="string") raw.push(x); else if(x?.data) raw.push(x.data);}
  if(Array.isArray(body.attachments)) for(const a of body.attachments){if(a&&(a.kind==="image"||a.type==="image")&&typeof a.data==="string") raw.push(a.data);}
  const uniq=[...new Set(raw)];
  if(uniq.length>2) throw new Error("Max 2 images.");
  return uniq.map((x,i)=>normalizeImage(x,body.fileName||`image${i+1}.jpg`));
}
const responseFields=t=>({reply:t,answer:t,response:t,text:t,message:t,content:t,result:t});
const wantsVisual=m=>/\b(show image|picture|diagram|draw|visual|generate image|photo|microscopic|illustrate|morphology)\b/i.test(m||"");
const buildImageURL=p=>{
  const clean=String(p||"medical lab illustration").replace(/[\r\n]+/g," ").slice(0,700).trim();
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(clean+", medical lab, educational diagram")}?width=512&height=512&model=flux&nologo=true&seed=${Math.floor(Math.random()*2147483647)}`;
};
async function groqCall(key,model,messages,opts={}){
  const c=new AbortController(); const to=setTimeout(()=>c.abort(),opts.timeout||55000);
  try{
    const r=await fetch(GROQ_URL,{method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model,messages,temperature:0.55,max_tokens:1800}),signal:c.signal});
    const data=await r.json().catch(()=>({}));
    if(!r.ok){const e=new Error(data?.error?.message||`Groq ${r.status}`); e.status=r.status; throw e;}
    const out=data?.choices?.[0]?.message?.content; if(typeof out!=="string"||!out.trim()) throw new Error("Empty answer."); return out.trim();
  } finally{clearTimeout(to);}
}

export default async function handler(req,res){
  Object.entries(CORS).forEach(([k,v])=>res.setHeader(k,v));
  if(req.method==="OPTIONS") return res.status(204).end();
  if(req.method!=="POST") return send(res,405,{error:"Method not allowed."});
  try{
    let body=req.body; if(typeof body==="string"){try{body=JSON.parse(body);}catch{return send(res,400,{error:"Invalid JSON."});}}
    if(!body||typeof body!=="object") return send(res,400,{error:"JSON object required."});
    const message=pickString(body.message,body.prompt,body.question,body.text,body.content,body.query);
    let doc=pickString(body.extractedText,body.docText);
    if(!doc&&Array.isArray(body.attachments)){const a=body.attachments.find(x=>x?.text); if(a) doc=a.text;}
    if(doc.length>MAX_DOC_CHARS) doc=doc.slice(0,MAX_DOC_CHARS)+"\n[Truncated]";
    const images=getImages(body);
    if(!message&&!doc&&!images.length) return send(res,400,{error:"Enter MLS question or attach file."});
    if(images.some(x=>x.length>MAX_IMAGE_DATA_URL_CHARS)) return send(res,413,{error:"Image too large after compression."});
    const key=process.env.GROQ_API_KEY; if(!key) return send(res,500,{error:"GROQ_API_KEY missing."});
    
    if(!isAllowed(`${message} ${doc.slice(0,1000)}`)&&!images.length&&!doc){
      return send(res,200,responseFields("I'm THT MLS AI, focused on MLS / medical & health education and THT platform only. Ask an MLS, medical or health education question, or about THT uploads (2 images up to 100MB total, or 1 document PDF/DOCX/TXT up to 10MB)."));
    }

    let prompt=message||"Explain the study material.";
    if(doc) prompt=`DOCUMENT:\n${doc}\n\nQUESTION: ${prompt}`;

    const history=Array.isArray(body.history)?body.history.slice(-8):[];
    const prior=history.filter(h=>h?.content&&h.content.length<12000).map(h=>({role:h.role==="user"?"user":"assistant",content:h.content}));

    let answer;
    if(images.length){
      const content=[{type:"text",text:prompt},...images.map(u=>({type:"image_url",image_url:{url:u}}))];
      answer=await groqCall(key,VISION_MODEL,[{role:"system",content:SYSTEM_PROMPT},...prior,{role:"user",content}]);
    }else{
      answer=await groqCall(key,TEXT_MODEL,[{role:"system",content:SYSTEM_PROMPT},...prior,{role:"user",content:prompt}]);
    }

    const tag=/\[GENERATE_IMAGE:\s*([\s\S]*?)\s*\]/i; const m=answer.match(tag);
    let finalText=answer;
    if(m) finalText=answer.replace(tag,`\n\n![Visual](${buildImageURL(m[1].trim())})\n\n`);
    else if(wantsVisual(message)) finalText+=`\n\n![Visual](${buildImageURL(message+" medical lab educational")})`;

    return send(res,200,responseFields(finalText));
  }catch(err){
    const status=err.status>=400&&err.status<600?err.status:500;
    const msg=err.name==="AbortError"?"Timeout, retry.":(err.message||"AI error");
    return send(res,status,{error:msg});
  }
}
