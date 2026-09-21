export default async function handler(req, res) {
  if (req.method!== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { question, message, history = [], lastTopic } = req.body;
    const userQuestion = question || message;
    if (!userQuestion) return res.status(400).json({ error: 'No question provided' });
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY missing' });
    const lower = userQuestion.toLowerCase().trim();
    let finalPrompt = userQuestion;
    let tokenSize = 900;

    const yesExact = ['yes','y','yep','yup','yea','yah','yeh','yess','yeah','ya','alright','alrighty','aight','ok','okay','okk','k','kk','sure','bet','great','cool','nice','fine','okay na','yes o','yes oo','yes now','yupz'];
    const yesPhrases = ['sure thing','of course','definitely','absolutely','go ahead','proceed','continue','lets go',"let's go",'go on','why not','do it','show me','tell me','explain','i want','abeg','make you','na yes','yes abeg','teach me','lecture me'];
    const noExact = ['no','noo','nooo','nope','nah','nahh','nop','nopes','stop','cancel','end','quit','abort','leave','skip','later','no o','no oo'];
    const noPhrases = ['not now',"don't",'dont','never mind','nevermind','no thanks','not interested','noo thanks','make e no','leave am'];
    const moreWords = ['detailed','detail','more','elaborate','deep','full','textbook','comprehensive','expand','breakdown','indepth','further','exam trap','exam hack','hack','simplify','simple english','lecture'];
    const pidginWords = ['abeg','wetin','wey','dey','na','shey','how far','no sabi','i no understand','no understand','break am','pidgin','pijin','no too clear','e no clear'];
    const isYes = yesExact.includes(lower) || yesPhrases.some(w => lower.includes(w));
    const isNo = noExact.includes(lower) || noPhrases.some(w => lower.includes(w));
    const isMore = moreWords.some(w => lower.includes(w)) || lower.includes('explain more');
    const isPidginInput = pidginWords.some(w => lower.includes(w));

    if (isMore &&!isYes) {
      tokenSize = 2000;
      finalPrompt = `FULL PRO LECTURE with TRAPS+HACKS for: ${lastTopic || userQuestion}`;
    } else if (isYes &&!isMore) {
      tokenSize = 1100;
      finalPrompt = `User said YES "${userQuestion}" to continue. Last topic: ${lastTopic}. If last was Pidgin offer and YES, switch to Pidgin + MLS terms. Else continue related subtopic with trap+hack.`;
    } else if (isNo) {
      return res.status(200).json({ status: 'online', answer: `Got it! 🛑 No wahala!\n\nAsk any other MLS, Health or AI question when ready! 🧬\n\n💡 Tip: Type "more" for full lecture + exam traps & hacks.` });
    } else if (isPidginInput) {
      finalPrompt = `User speaks Pidgin/Broken: "${userQuestion}". Last topic: ${lastTopic}. Handle per Pidgin rule.`;
    }

    // --- TRUTHFUL PDF MAPPER - SHORT DISPLAY NO CUT-OFF - NO LIE ---
    function getPdfRecommendation(q, topic) {
      const text = `${q} ${topic||''}`.toLowerCase();
      if (text.match(/anemia|hb|hemoglobin|pcv|wbc|rbc|hematology|blood cell|platelet|bone marrow|iron|esr|blood film|clotting|coagulation|blood cell count|egfr.*blood|wbc differential/)) return { short: 'PDF 7: Diagnostic Hematology', full: '300L_DIAGNOSTIC_HEMATOLOGY_VOL_I.pdf' };
      if (text.match(/lft|rft|liver|kidney|creatinine|urea|bilirubin|electrolyte|metabolic|serum protein|clinical chemistry|urine test|egfr calculator|ckd-epi/)) return { short: 'PDF 8: Clinical Biochemistry', full: '300L_CLINICAL_BIOCHEMISTRY_SYSTEMS.pdf' };
      if (text.match(/bacteria|virus|microbiology|culture|media preparation|aerobic|biochemical reaction|gram stain|antibiotic|sensitivity/)) return { short: 'PDF 9: Medical Microbiology', full: '300L_MEDICAL_MICROBIOLOGY_TECHNIQUES.pdf' };
      if (text.match(/histopathology|tissue processing|microtomy|biopsy|staining|fixation/)) return { short: 'PDF 10: Histopathology', full: '400L_HISTOPATHOLOGY_TISSUE_PROCESSING.pdf' };
      if (text.match(/parasite|parasitology|helminth|protozoa|fecal|stool|vector|malaria|amoeba|giardia/)) return { short: 'PDF 11: Parasitology & Vectors', full: '400L_MEDICAL_PARASITOLOGY_VECTORS.pdf' };
      if (text.match(/immunology|serology|elisa|antibody|antigen|latex|vdrl|widal|hiv screening|hepatitis screen/)) return { short: 'PDF 12: Immunology & Serology', full: '400L_IMMUNOLOGY_SEROLOGY_DIAGNOSTICS.pdf' };
      if (text.match(/blood transfusion|blood bank|cross.?match|coombs|antibody titration|blood group|storage|donor|compatibility/)) return { short: 'PDF 13: Blood Transfusion', full: '500L_BLOOD_TRANSFUSION_SCIENCES.pdf' };
      if (text.match(/lab informatics|lis|informatics|laboratory network|database|system interface|laboratory software/)) return { short: 'PDF 14: Lab Informatics', full: '500L_CLINICAL_LAB_INFORMATICS.pdf' };
      if (text.match(/epidemiology|research|thesis|outbreak|surveillance|medical math|sampling|statistics|study design/)) return { short: 'PDF 15: Epidemiology & Thesis', full: '500L_EPIDEMIOLOGY_RESEARCH_THESIS.pdf' };
      if (text.match(/anatomy|physiology|organ system|endocrine|renal physiology|heart|circulation|respiratory/)) return { short: 'PDF 5: Anatomy & Physiology', full: '200L_BASIC_ANATOMY_PHYSIOLOGY_METRICS.pdf' };
      if (text.match(/organic|metabolism|carbohydrate|lipid|protein metabolism|enzyme|krebs|glycolysis/)) return { short: 'PDF 6: Organic Biochemistry', full: '200L_ORGANIC_BIOCHEMISTRY_FOUNDATIONS.pdf' };
      if (text.match(/analytical|blood collection|anticoagulant|edta|phlebotomy|safety|lab metrics|quality control|measurement/)) return { short: 'PDF 4: Analytical Lab Metrics', full: '200L_ANALYTICAL_LAB_METRICS_MANUAL.pdf' };
      if (text.match(/medical chemistry|atomic|buffer|mole|solution|ph|subshell|electron|matrix formula/)) return { short: 'PDF 1: Medical Chemistry', full: '100L_INTRODUCTION_TO_MEDICAL_CHEMISTRY.pdf' };
      if (text.match(/cellular biology|cell biology|membrane|nucleus|genetic transcription|tissue classification|cell interaction/)) return { short: 'PDF 2: Cellular Biology', full: '100L_CELLULAR_BIOLOGY_CORE_BASICS.pdf' };
      if (text.match(/medical physics|fluid mechanics|radioactive|isotope|transducer|biomedical physics/)) return { short: 'PDF 3: Medical Physics', full: '100L_FOUNDATIONAL_MEDICAL_PHYSICS.pdf' };
      return null;
    }

    const pdfMatch = getPdfRecommendation(userQuestion, lastTopic);
    const recentHistory = history.slice(-12);

    const systemInstruction = `You are TRUST AI LAB ASSISTANT - Global Pro Lecturer AI for MLS, Health, AI, Use of English.
CATALOG OF 15 REAL PDFs (FOR SYSTEM USE ONLY - DO NOT LIST IN ANSWER):
1. 100L_INTRODUCTION_TO_MEDICAL_CHEMISTRY.pdf
2. 100L_CELLULAR_BIOLOGY_CORE_BASICS.pdf
3. 100L_FOUNDATIONAL_MEDICAL_PHYSICS.pdf
4. 200L_ANALYTICAL_LAB_METRICS_MANUAL.pdf
5. 200L_BASIC_ANATOMY_PHYSIOLOGY_METRICS.pdf
6. 200L_ORGANIC_BIOCHEMISTRY_FOUNDATIONS.pdf
7. 300L_DIAGNOSTIC_HEMATOLOGY_VOL_I.pdf
8. 300L_CLINICAL_BIOCHEMISTRY_SYSTEMS.pdf
9. 300L_MEDICAL_MICROBIOLOGY_TECHNIQUES.pdf
10. 400L_HISTOPATHOLOGY_TISSUE_PROCESSING.pdf
11. 400L_MEDICAL_PARASITOLOGY_VECTORS.pdf
12. 400L_IMMUNOLOGY_SEROLOGY_DIAGNOSTICS.pdf
13. 500L_BLOOD_TRANSFUSION_SCIENCES.pdf
14. 500L_CLINICAL_LAB_INFORMATICS.pdf
15. 500L_EPIDEMIOLOGY_RESEARCH_THESIS.pdf

LANGUAGE RULE: Default Simple English. If user Pidgin like "abeg, wetin, break am", first explain simple English, then ASK: "Would you like me to explain in Pidgin? Type Yes or No." If YES -> Pidgin + MLS terms.
FORMATTING: NEVER USE ### or ##. Use ONLY 1️⃣ 2️⃣ 3️⃣ for headings, - for bullets, **bold** for key terms.
PRO LECTURER STRUCTURE - FOR EVERY ANSWER MUST INCLUDE:
1️⃣ Definition / Overview
2️⃣ Key Points / Types / Causes / Normal Values
3️⃣ Clinical / Lab Significance
4️⃣ ⚠️ EXAM TRAP ALERT: 2 traps
5️⃣ 🧠 EXAM HACK: 1-2 mnemonics
6️⃣ Simple English Summary
End with: 💡 Type "more" for full textbook lecture + more traps & hacks. 👉 Related: Want to explore "[relevant subtopic]"? Type Yes / No.
IMPORTANT: Do NOT mention any PDF inside your lecture. Do NOT add "Recommended PDF". System footer will handle it. You focus only on lecture content.
ALLOWED: MLS, Health, Medicine, AI basics, Use of English. TONE: Lecturer, friendly.`;

    const messages = [{ role: 'system', content: systemInstruction },...recentHistory, { role: 'user', content: finalPrompt }];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai/gpt-oss-20b', messages, temperature: 0.38, max_tokens: tokenSize })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Groq error');
    let cleanAnswer = data.choices[0].message.content.replace(/###/g, '').replace(/##/g, '').replace(/^#+\s/gm, '').trim();

    let promoFooter;
    if (pdfMatch) {
      promoFooter = `\n\n---\n📚 Love this topic? Keep it!\nFor this exact topic, get:\n**${pdfMatch.short}**\n(${pdfMatch.full})\n⬇️ Scroll up ☝️ Top of page - Tap Get File! 🧬`;
    } else {
      promoFooter = `\n\n---\n📚 Love this lecture? Keep it!\n⬇️ Browse 15 PDFs at top - Use search bar for your topic!\n☝️ Scroll up to get your copy! 🧬`;
    }

    cleanAnswer = cleanAnswer + promoFooter;
    return res.status(200).json({ status: 'online', answer: cleanAnswer });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
                       }
