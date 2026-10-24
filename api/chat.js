// api/chat.js — THT MLS PREP Groq API (Vercel serverless)
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = process.env.GROQ_TEXT_MODEL || "openai/gpt-oss-20b";
const VISION_MODEL = process.env.GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct";
const MAX_DOC_CHARS = 90000;
const MAX_IMAGE_DATA_URL_CHARS = 1_350_000;

const SYSTEM_PROMPT = `You are THT MLS PREP - ELITE Medical Laboratory Science tutor for Nigeria. You are like Opera AI Pro but specialized for MLS. You make complex MLS easy.

YOUR ANSWER STRUCTURE MUST ALWAYS BE THIS PREMIUM FORMAT (This makes students feel it's worth it):

🔬 TOPIC: [Topic Name]

[Simple clear explanation in Nigerian student English, not too big grammar]

✅ KEY POINTS TO KNOW:
- Point 1
- Point 2
- Point 3

💡 MLS EXAM TRAP: [Explain how examiners trap students on this topic - e.g., 'Examiners will show you P. vivax vs P. ovale and ask difference - trap is Schüffner dots both present but...']

🧠 MNEMONIC / HACK: [Give easy mnemonic to remember - e.g., 'For Enterobacteriaceae lactose fermenters: "STINK" = Salmonella, Typhi...']

⚡ CBT SPEED TIP: [Give quick recall trick for CBT exam - e.g., 'If you see ring with double chromatin in 3 seconds, tick Falciparum, don't waste time']

⚠️ COMMON MISTAKE: [What 90% of MLS students fail]

VISUAL ILLUSTRATION RULE: When a simple educational illustration materially helps explain blood cell morphology, blood parasites, bacteria shapes, fungi, histology, staining concepts, laboratory equipment, life cycles, or similar visual MLS topics, add one final marker: [GENERATE_IMAGE: concise description]. Prefer prompts such as 'red blood cells under microscope, medical lab, educational diagram, clean background'. Do not add the marker for calculations, text-only concepts, or when a generated visual could mislead. Clearly distinguish illustrative artwork from authentic microscopy evidence.

Be accurate and candid. Never invent a source or claim that an answer was verified against a source unless a source was actually consulted. Treat medical content as educational, not patient-specific diagnosis or treatment. Mnemonics and exam tips must be correct; if unsure, say so briefly.`;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};
function send(res, status, payload) {
  Object.entries(CORS).forEach(([k,v])=>res.setHeader(k,v));
  return res.status(status).json(payload);
}
function pickString(...values) {
  for (const v of values) if (typeof v === "string" && v.trim()) return v.trim();
  return "";
}
function normalizeImage(value, name) {
  if (typeof value !== "string" || !value.trim()) return null;
  let data=value.trim();
  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(data)) return data;
  if (/^data:image\/(heic|heif);base64,/i.test(data)) {
    throw new Error("HEIC/HEIF must be converted to JPG or PNG by the browser before analysis.");
  }
  if (/^https?:\/\//i.test(data)) throw new Error("Remote image URLs are not accepted. Send a compressed image data URL.");
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(data)) throw new Error("Unsupported image encoding.");
  const ext=(name||"").toLowerCase();
  const mime=/\.png$/.test(ext)?"image/png":/\.webp$/.test(ext)?"image/webp":"image/jpeg";
  return `data:${mime};base64,${data.replace(/\s/g,"")}`;
}
function getImages(body) {
  const raw=[
    body.image,body.image1,body.image2,body.imageBase64,body.base64Image
  ].filter(v=>typeof v==="string"&&v.trim());
  if (Array.isArray(body.images)) for (const x of body.images) {
    if (typeof x==="string") raw.push(x);
    else if (x && typeof x.data==="string") raw.push(x.data);
  }
  if (Array.isArray(body.attachments)) for (const a of body.attachments) {
    if (a && (a.kind==="image" || a.type==="image") && typeof a.data==="string") raw.push(a.data);
  }
  const uniq=[...new Set(raw)];
  if (uniq.length>2) throw new Error("A maximum of two images is allowed.");
  return uniq.map((x,i)=>normalizeImage(x,body.fileName||body.filename||`image${i+1}.jpg`));
}
function responseFields(finalText) {
  return {reply:finalText,answer:finalText,response:finalText,text:finalText,message:finalText,content:finalText,result:finalText};
}
function wantsVisual(message) {
  return /\b(show image|real image|picture|diagram|draw|visual|generate image|photo|microscopic|illustrate)\b/i.test(message);
}
function buildImageURL(prompt) {
  // Pollinations.ai is the configured image provider. Keep prompts concise and educational.
  const clean=String(prompt||"medical laboratory science illustration").replace(/[\r\n]+/g," ").slice(0,700).trim();
  const enhanced=`${clean}, medical lab, educational diagram, clean background`;
  const seed=Math.floor(Math.random()*2147483647);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?width=512&height=512&model=flux&nologo=true&seed=${seed}`;
}
async function groqCall(key, model, messages, opts={}) {
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),opts.timeout||55000);
  try {
    const r=await fetch(GROQ_URL,{
      method:"POST",
      headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json"},
      body:JSON.stringify({model,messages,temperature:0.55,max_tokens:1800}),
      signal:controller.signal
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok){
      const err=new Error(data?.error?.message||`Groq request failed (${r.status}).`);
      err.status=r.status;throw err;
    }
    const out=data?.choices?.[0]?.message?.content;
    if(typeof out!=="string"||!out.trim())throw new Error("Groq returned an empty answer.");
    return out.trim();
  } finally {clearTimeout(timeout);}
}
export default async function handler(req,res) {
  Object.entries(CORS).forEach(([k,v])=>res.setHeader(k,v));
  if(req.method==="OPTIONS")return res.status(204).end();
  if(req.method!=="POST")return send(res,405,{error:"Method not allowed."});
  try {
    let body=req.body;
    if(typeof body==="string"){try{body=JSON.parse(body);}catch{return send(res,400,{error:"Request body is not valid JSON."});}}
    if(!body||typeof body!=="object"||Array.isArray(body))return send(res,400,{error:"A JSON object is required."});
    const message=pickString(body.message,body.prompt,body.question,body.text,body.content,body.query);
    let doc=pickString(body.extractedText,body.docText);
    if(!doc && Array.isArray(body.attachments)){
      const a=body.attachments.find(x=>x&&typeof x.text==="string");
      if(a)doc=a.text;
    }
    if(doc.length>MAX_DOC_CHARS)doc=doc.slice(0,MAX_DOC_CHARS)+"\n[Document text truncated for safe processing.]";
    const images=getImages(body);
    if(!message&&!doc&&!images.length)return send(res,400,{error:"Enter a question or attach supported study material."});
    if(images.some(x=>x.length>MAX_IMAGE_DATA_URL_CHARS))return send(res,413,{error:"Image payload is too large after compression. Please reselect the image."});
    const key=process.env.GROQ_API_KEY;
    if(!key)return send(res,500,{error:"GROQ_API_KEY is not configured on Vercel."});
    let prompt=message||"Explain the supplied study material and identify its key learning points.";
    if(doc)prompt=`STUDENT UPLOADED MLS DOCUMENT CONTENT (use this as reference):\n${doc}\n\nSTUDENT QUESTION: ${prompt}\n\nAnswer based on document + your MLS knowledge. If the document appears incomplete or conflicts with reliable MLS knowledge, clearly identify the uncertainty.`;
    const history=Array.isArray(body.history)?body.history.slice(-8):[];
    const prior=history.filter(h=>h&&typeof h.content==="string"&&h.content.length<12000)
      .map(h=>({role:h.role==="user"?"user":"assistant",content:h.content}));
    let answer;
    if(images.length){
      const content=[{type:"text",text:prompt},...images.map(url=>({type:"image_url",image_url:{url}}))];
      const messages=[{role:"system",content:SYSTEM_PROMPT},...prior,{role:"user",content}];
      try {
        answer=await groqCall(key,VISION_MODEL,messages);
      } catch(visionError) {
        // Qwen text backup cannot inspect the submitted pixels; do not pretend it can.
        // Preserve the failure reason rather than silently claiming image interpretation.
        const isConfigOrQuota=[400,401,403,404,413,429].includes(visionError.status);
        if(isConfigOrQuota)throw new Error(`Vision model request failed: ${visionError.message}`);
        throw new Error(`Vision analysis failed. Please retry with a smaller JPG/PNG image. ${visionError.message}`);
      }
    } else {
      answer=await groqCall(key,TEXT_MODEL,[{role:"system",content:SYSTEM_PROMPT},...prior,{role:"user",content:prompt}]);
    }
    const tag=/\[GENERATE_IMAGE:\s*([\s\S]*?)\s*\]/i;
    const match=answer.match(tag);
    const auto=wantsVisual(message);
    let finalText=answer;
    if(match){
      const generated=buildImageURL(match[1].trim());
      finalText=answer.replace(tag,`\n\n![Visual Explanation](${generated})\n\n`);
    } else if(auto) {
      finalText+=`\n\n![Visual Explanation](${buildImageURL(message+" medical laboratory science educational detailed realistic 4k")})`;
    }
    return send(res,200,responseFields(finalText));
  } catch(err) {
    const status=Number.isInteger(err.status)&&err.status>=400&&err.status<600?err.status:500;
    const msg=err.name==="AbortError"?"The AI request timed out. Please retry.":(err.message||"Unexpected AI service error.");
    return send(res,status,{error:msg});
  }
}
                                        
