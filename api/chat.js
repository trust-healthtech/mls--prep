// api/chat.js — MLSCN 150 IMAGES — REAL CLINICAL + EXAM — CLEAN TUTOR — FREE KEY
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TEXT_MODEL = "openai/gpt-oss-20b";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `You are THT MLS Senior Tutor for MLSCN Nigeria curriculum. Real human senior lecturer. Warm, direct, guide to pass.

STRICT: DO NOT use **, *, -, +, /, #, markdown. Clean plain text only.

FORMAT FOR EVERY ACADEMIC ANSWER:
🔬 TOPIC: [topic]

📖 SIMPLE EXPLANATION:
[2-3 lab style lines]

✅ WHAT YOU MUST KNOW FOR MLSCN EXAM:
[plain lines with colon]

🧠 EXAM TRAP:
[where students fail in council exam]

💡 CLINICAL LAB HACK:
[real lab trick you use]

⚡ CBT SPEED TIP:
[20 seconds]

🎯 TUTORS ADVICE:
[one line]

End with [IMAGE: keyword] one word. Example [IMAGE: plasmodium]
`;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const send = (res,s,p)=>{ Object.entries(CORS).forEach(([k,v])=>res.setHeader(k,v)); return res.status(s).json(p); };
const pickString = (...v)=>{ for(const x of v) if(typeof x==="string"&&x.trim()) return x.trim(); return ""; };
function getImages(b){ const raw=[b.image,b.image1,b.image2,b.imageBase64].filter(v=>typeof v==="string"&&v.trim()); return [...new Set(raw)].slice(0,2); }

const REAL_IMAGES = {
  // === 100L FOUNDATION ===
  "eukaryotic": "https://upload.wikimedia.org/wikipedia/commons/0/0e/Eukaryotic_cell.jpg",
  "prokaryotic": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Prokaryote_cell.jpg",
  "mitosis": "https://upload.wikimedia.org/wikipedia/commons/9/9a/Mitosis.jpg",
  "meiosis": "https://upload.wikimedia.org/wikipedia/commons/1/1b/Meiosis.jpg",
  "dna": "https://upload.wikimedia.org/wikipedia/commons/1/1e/DNA.jpg",
  "chromosome": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Chromosome.jpg",
  "atomic structure": "https://upload.wikimedia.org/wikipedia/commons/5/5f/Atom.jpg",
  "titration": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Titration.jpg",
  "buffer": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Buffer_solution.jpg",

  // === 200L HISTOLOGY / PHYSIOLOGY / BIOCHEM ===
  "microscope": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Microscope.jpg",
  "epithelial": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Epithelial_tissue.jpg",
  "connective tissue": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Connective_tissue.jpg",
  "muscle tissue": "https://upload.wikimedia.org/wikipedia/commons/9/9c/Muscle_tissue.jpg",
  "nervous tissue": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Nervous_tissue.jpg",
  "nephron": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Nephron.jpg",
  "liver lobule": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Liver_lobule.jpg",
  "kidney": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Kidney.jpg",
  "rbc": "https://upload.wikimedia.org/wikipedia/commons/f/f3/Red_Blood_Cells.jpg",
  "wbc": "https://upload.wikimedia.org/wikipedia/commons/b/b5/White_blood_cells.jpg",
  "neutrophil": "https://upload.wikimedia.org/wikipedia/commons/8/8d/Neutrophil.jpg",
  "lymphocyte": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Lymphocyte.jpg",
  "monocyte": "https://upload.wikimedia.org/wikipedia/commons/5/5b/Monocyte.jpg",
  "eosinophil": "https://upload.wikimedia.org/wikipedia/commons/9/9a/Eosinophil.jpg",
  "basophil": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Basophil.jpg",
  "platelet": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Platelet.jpg",
  "ecg": "https://upload.wikimedia.org/wikipedia/commons/0/0b/ECG.jpg",
  "glycolysis": "https://upload.wikimedia.org/wikipedia/commons/0/0c/Glycolysis.jpg",
  "krebs cycle": "https://upload.wikimedia.org/wikipedia/commons/6/6b/Citric_acid_cycle.jpg",
  "biosafety": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Biosafety_cabinet.jpg",
  "ppe": "https://upload.wikimedia.org/wikipedia/commons/5/5f/PPE.jpg",
  "autoclave": "https://upload.wikimedia.org/wikipedia/commons/9/9a/Autoclave.jpg",
  "centrifuge": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Centrifuge.jpg",
  "spectrophotometer": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Spectrophotometer.jpg",

  // === 300L MICROBIOLOGY GENERAL ===
  "gram stain": "https://upload.wikimedia.org/wikipedia/commons/0/0f/Gram_stain.jpg",
  "acid fast": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Acid_fast_bacilli.jpg",
  "capsule stain": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Capsule_stain.jpg",
  "endospore": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Endospore.jpg",
  "bacterial structure": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Bacterial_cell.jpg",
  "culture media": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Culture_media.jpg",
  "nutrient agar": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Nutrient_agar.jpg",
  "blood agar": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Blood_agar.jpg",
  "macconkey": "https://upload.wikimedia.org/wikipedia/commons/4/4a/MacConkey_agar.jpg",
  "growth curve": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Bacterial_growth_curve.jpg",
  "pcv": "https://upload.wikimedia.org/wikipedia/commons/1/1a/PCV_test.jpg",
  "hemoglobin": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Hemoglobin.jpg",
  "reticulocyte": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Reticulocyte.jpg",
  "abo blood": "https://upload.wikimedia.org/wikipedia/commons/1/1a/ABO_blood_types.jpg",
  "rh blood": "https://upload.wikimedia.org/wikipedia/commons/2/2a/Rh_blood_group.jpg",
  "h and e stain": "https://upload.wikimedia.org/wikipedia/commons/9/9a/H_and_E_stain.jpg",
  "microtome": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Microtome.jpg",
  "mosquito": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Anopheles_mosquito.jpg",
  "anopheles": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Anopheles.jpg",
  "aedes": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Aedes_aegypti.jpg",
  "culex": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Culex.jpg",
  "tsetse fly": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Tsetse_fly.jpg",
  "blackfly": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Blackfly.jpg",

  // === PROTOZOA — MLSCN VITAL ===
  "amoeba": "https://upload.wikimedia.org/wikipedia/commons/0/0e/Amoeba_proteus.jpg",
  "entamoeba histolytica": "https://upload.wikimedia.org/wikipedia/commons/5/51/Entamoeba_histolytica.jpg",
  "entamoeba coli": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Entamoeba_coli.jpg",
  "giardia": "https://upload.wikimedia.org/wikipedia/commons/a/a5/Giardia_lamblia.jpg",
  "trichomonas": "https://upload.wikimedia.org/wikipedia/commons/8/8d/Trichomonas_vaginalis.jpg",
  "leishmania": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Leishmania.jpg",
  "trypanosoma": "https://upload.wikimedia.org/wikipedia/commons/3/3f/Trypanosoma.jpg",
  "plasmodium": "https://upload.wikimedia.org/wikipedia/commons/0/08/Plasmodium_falciparum.jpg",
  "plasmodium falciparum": "https://upload.wikimedia.org/wikipedia/commons/0/08/Plasmodium_falciparum.jpg",
  "plasmodium vivax": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Plasmodium_vivax.jpg",
  "spirogyra": "https://upload.wikimedia.org/wikipedia/commons/a/a3/Spirogyra.jpg",
  "paramecium": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Paramecium.jpg",
  "euglena": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Euglena.jpg",
  "balantidium": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Balantidium_coli.jpg",
  "cryptosporidium": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Cryptosporidium.jpg",
  "toxoplasma": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Toxoplasma_gondii.jpg",

  // === HELMINTHS — MLSCN VITAL ===
  "ascaris": "https://upload.wikimedia.org/wikipedia/commons/1/11/Ascaris_lumbricoides_egg.jpg",
  "ascaris lumbricoides": "https://upload.wikimedia.org/wikipedia/commons/1/11/Ascaris_lumbricoides_egg.jpg",
  "hookworm": "https://upload.wikimedia.org/wikipedia/commons/f/f8/Hookworm_egg.jpg",
  "ancylostoma": "https://upload.wikimedia.org/wikipedia/commons/f/f8/Hookworm_egg.jpg",
  "trichuris": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Trichuris_trichiura_egg.jpg",
  "trichuris trichiura": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Trichuris_trichiura_egg.jpg",
  "enterobius": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Enterobius_vermicularis_egg.jpg",
  "strongyloides": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Strongyloides_stercoralis.jpg",
  "taenia": "https://upload.wikimedia.org/wikipedia/commons/7/7a/Taenia_solium_egg.jpg",
  "taenia solium": "https://upload.wikimedia.org/wikipedia/commons/7/7a/Taenia_solium_egg.jpg",
  "taenia saginata": "https://upload.wikimedia.org/wikipedia/commons/7/7a/Taenia_saginata.jpg",
  "hymenolepis nana": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Hymenolepis_nana_egg.jpg",
  "echinococcus": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Echinococcus_granulosus.jpg",
  "schistosoma": "https://upload.wikimedia.org/wikipedia/commons/9/9a/Schistosoma_mansoni_egg.jpg",
  "schistosoma mansoni": "https://upload.wikimedia.org/wikipedia/commons/9/9a/Schistosoma_mansoni_egg.jpg",
  "schistosoma haematobium": "https://upload.wikimedia.org/wikipedia/commons/8/8a/Schistosoma_haematobium_egg.jpg",
  "fasciola": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Fasciola_hepatica_egg.jpg",
  "wuchereria": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Wuchereria_bancrofti.jpg",
  "onchocerca": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Onchocerca_volvulus.jpg",
  "loaloa": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Loa_loa.jpg",

  // === BACTERIOLOGY — MLSCN VITAL 400L ===
  "staphylococcus": "https://upload.wikimedia.org/wikipedia/commons/d/d3/Staphylococcus_aureus_Gram.jpg",
  "staphylococcus aureus": "https://upload.wikimedia.org/wikipedia/commons/d/d3/Staphylococcus_aureus_Gram.jpg",
  "streptococcus": "https://upload.wikimedia.org/wikipedia/commons/2/24/Streptococcus_pyogenes.jpg",
  "streptococcus pneumoniae": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Streptococcus_pneumoniae.jpg",
  "bacillus anthracis": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Bacillus_anthracis.jpg",
  "clostridium tetani": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Clostridium_tetani.jpg",
  "clostridium perfringens": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Clostridium_perfringens.jpg",
  "corynebacterium": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Corynebacterium_diphtheriae.jpg",
  "e coli": "https://upload.wikimedia.org/wikipedia/commons/b/bf/E_coli_Gram.jpg",
  "klebsiella": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Klebsiella_pneumoniae.jpg",
  "proteus": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Proteus_mirabilis.jpg",
  "salmonella": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Salmonella.jpg",
  "salmonella typhi": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Salmonella_typhi.jpg",
  "shigella": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Shigella.jpg",
  "pseudomonas": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Pseudomonas_aeruginosa.jpg",
  "neisseria gonorrhoeae": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Neisseria_gonorrhoeae.jpg",
  "neisseria meningitidis": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Neisseria_meningitidis.jpg",
  "haemophilus": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Haemophilus_influenzae.jpg",
  "vibrio cholerae": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Vibrio_cholerae.jpg",
  "mycobacterium tuberculosis": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Acid_fast_bacilli.jpg",
  "treponema": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Treponema_pallidum.jpg",
  "kirby bauer": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Kirby_Bauer_test.jpg",
  "mrsa": "https://upload.wikimedia.org/wikipedia/commons/9/9a/MRSA.jpg",
  "esbl": "https://upload.wikimedia.org/wikipedia/commons/5/5a/ESBL.jpg",

  // === HEMATOLOGY CLINICAL — MLSCN VITAL ===
  "sickle cell": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Sickle_cells.jpg",
  "thalassemia": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Thalassemia.jpg",
  "iron deficiency": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Iron_deficiency_anemia.jpg",
  "reticulocyte": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Reticulocyte.jpg",
  "spherocytosis": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Spherocytosis.jpg",
  "blast cell": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Blast_cell.jpg",
  "aml": "https://upload.wikimedia.org/wikipedia/commons/5/5a/AML.jpg",
  "all": "https://upload.wikimedia.org/wikipedia/commons/4/4a/ALL.jpg",
  "cml": "https://upload.wikimedia.org/wikipedia/commons/6/6a/CML.jpg",
  "cll": "https://upload.wikimedia.org/wikipedia/commons/5/5a/CLL.jpg",
  "platelet": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Platelet.jpg",
  "pt inr": "https://upload.wikimedia.org/wikipedia/commons/5/5a/PT_INR.jpg",
  "aptt": "https://upload.wikimedia.org/wikipedia/commons/4/4a/APTT.jpg",
  "electrophoresis": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Gel_electrophoresis.jpg",
  "hplc": "https://upload.wikimedia.org/wikipedia/commons/4/4a/HPLC.jpg",

  // === CHEM PATH — MLSCN VITAL ===
  "bilirubin": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Bilirubin_metabolism.jpg",
  "jaundice": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Jaundice.jpg",
  "liver function": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Liver_function_test.jpg",
  "gfr": "https://upload.wikimedia.org/wikipedia/commons/3/3e/GFR.jpg",
  "creatinine": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Creatinine.jpg",
  "troponin": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Troponin.jpg",

  // === IMMUNOLOGY / SEROLOGY ===
  "elisa": "https://upload.wikimedia.org/wikipedia/commons/4/4a/ELISA.jpg",
  "agglutination": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Agglutination_test.jpg",
  "vdrl": "https://upload.wikimedia.org/wikipedia/commons/4/4a/VDRL.jpg",
  "widal": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Widal_test.jpg",
  "hiv test": "https://upload.wikimedia.org/wikipedia/commons/6/6a/HIV_test.jpg",

  // === HISTOPATH / CYTO — MLSCN VITAL ===
  "pap smear": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Pap_smear.jpg",
  "bethesda": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Bethesda_system.jpg",
  "pas stain": "https://upload.wikimedia.org/wikipedia/commons/5/5a/PAS_stain.jpg",
  "zn stain": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Acid_fast_bacilli.jpg",
  "perls stain": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Perls_stain.jpg",

  // === ADVANCED / QA ===
  "levey jennings": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Levey_Jennings_chart.jpg",
  "westgard": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Westgard_rules.jpg",
  "pcr": "https://upload.wikimedia.org/wikipedia/commons/4/4a/PCR.jpg",
  "gene xpert": "https://upload.wikimedia.org/wikipedia/commons/5/5a/GeneXpert.jpg",
  "flow cytometry": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Flow_cytometry.jpg",
  "kato katz": "https://upload.wikimedia.org/wikipedia/commons/6/6a/Kato_Katz.jpg",
  "formol ether": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Formol_ether.jpg",
  "hdfn": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Hemolytic_disease_newborn.jpg",
  "cross match": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Cross_match.jpg",
  "candida": "https://upload.wikimedia.org/wikipedia/commons/2/2e/Candida_albicans.jpg",
  "aspergillus": "https://upload.wikimedia.org/wikipedia/commons/5/5a/Aspergillus.jpg"
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
      answer = await groqCall(key, VISION_MODEL, [{role:"system",content:SYSTEM_PROMPT},{role:"user",content:prompt}]);
    } else {
      answer = await groqCall(key, TEXT_MODEL, [{role:"system",content:SYSTEM_PROMPT},{role:"user",content:prompt}]);
    }

    answer = answer.replace(/\*\*/g, "").replace(/\*/g, "").replace(/##/g, "");
    
    let imageUrl = null;
    const imgTag = /\[IMAGE:\s*([a-zA-Z0-9_ ]+)\s*\]/i;
    const m = answer.match(imgTag);
    if(m){ imageUrl = buildImageURL(m[1]); answer = answer.replace(imgTag, "").trim(); }
    else { imageUrl = buildImageURL(message); }

    answer = answer.replace(/\[Visual\]/gi, "").replace(/\(https:\/\/[^\)]+\)/g, "").trim();

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
