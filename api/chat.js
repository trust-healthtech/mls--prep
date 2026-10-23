import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, message, history = [], lastTopic, attachment } = req.body;
    const userQuestion = question || message;
    
    if (!userQuestion) {
      return res.status(400).json({ error: 'No query provided' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(500).json({ error: 'System configuration error: API key unavailable.' });
    }

    const lower = userQuestion.toLowerCase().trim();
    let finalPrompt = userQuestion;
    let tokenSize = 2500; 

    // --- STRICT MEDICAL AND HEALTH SCOPE VALIDATION ---
    const medicalKeywords = [
      'anemia', 'hemoglobin', 'pcv', 'wbc', 'rbc', 'hematology', 'blood', 'platelet', 'marrow', 'esr', 'clotting', 'coagulation',
      'lft', 'rft', 'liver', 'kidney', 'creatinine', 'urea', 'bilirubin', 'electrolyte', 'metabolic', 'serum', 'urine', 'egfr',
      'bacteria', 'virus', 'microbiology', 'culture', 'stain', 'antibiotic', 'parasite', 'helminth', 'malaria', 'amoeba',
      'histopathology', 'tissue', 'biopsy', 'fixation', 'staining', 'immunology', 'serology', 'elisa', 'antibody', 'antigen',
      'transfusion', 'crossmatch', 'coombs', 'blood bank', 'donor', 'lab', 'laboratory', 'pathology', 'cell', 'glucose', 'protein',
      'plasma', 'clinical', 'infection', 'disease', 'phlebotomy', 'specimen', 'anticoagulant', 'edta', 'serum', 'dilution', 'analyte',
      'explain', 'what', 'how', 'why', 'lecture', 'define', 'test', 'microscope', 'serological', 'count', 'indices', 'mcv', 'mch', 'mchc'
    ];

    const shortInputExceptions = ['yes', 'y', 'more', 'explain', 'continue', 'proceed', 'ok', 'okay', 'no', 'stop'];
    const isException = shortInputExceptions.includes(lower);
    const hasMedicalContext = medicalKeywords.some(keyword => lower.includes(keyword)) || 
                               (lastTopic && medicalKeywords.some(keyword => lastTopic.toLowerCase().includes(keyword)));

    if (!isException && !hasMedicalContext) {
      return res.status(200).json({
        status: 'online',
        answer: 'System Restraint: This platform is exclusively optimized for Medical Laboratory Science (MLS), clinical medicine, and healthcare diagnostics. Please submit a valid medical topic, laboratory parameter, or diagnostic graphic for analysis.',
        topic: lastTopic || 'Out of Scope'
      });
    }

    // --- CONTINUITY ENGINE ---
    const yesExact = ['yes','y','yep','yup','yea','yah','yeh','yess','yeah','ya','alright','alrighty','aight','ok','okay','okk','k','kk','sure','bet','great','cool','nice','fine','okay na','yes o','yes oo','yes now','yupz'];
    const yesPhrases = ['sure thing','of course','definitely','absolutely','go ahead','proceed','continue','lets go',"let's go",'go on','why not','do it','show me','tell me','explain','i want','abeg','make you','na yes','yes abeg','teach me','lecture me'];
    const noExact = ['no','noo','nooo','nope','nah','nahh','nop','nopes','stop','cancel','end','quit','abort','leave','skip','later','no o','no oo'];
    const noPhrases = ['not now',"don't",'dont','never mind','nevermind','no thanks','not interested','noo thanks','make e no','leave am'];
    const localInformalWords = ['abeg','wetin','wey','dey','na','shey','how far','no sabi','i no understand','no understand','break am','pidgin','pijin','no too clear','e no clear'];
    
    const isYes = yesExact.includes(lower) || yesPhrases.some(w => lower.includes(w));
    const isNo = noExact.includes(lower) || noPhrases.some(w => lower.includes(w));
    const isInformalInput = localInformalWords.some(w => lower.includes(w));

    if (isNo) {
      return res.status(200).json({ 
        status: 'online', 
        answer: `Session status: Suspended.\n\nYou may resume at any point by submitting a valid Medical Laboratory Science parameter or clinical asset screenshot.`,
        topic: lastTopic || 'Session Terminated'
      });
    } else if (isYes) {
      finalPrompt = `The user requested to proceed with the exploration of the previous context. Prior topic: ${lastTopic}. Deepen the academic exploration by expanding into advanced diagnostic variations, specific clinical protocols, and analytical abnormalities.`;
    } else if (isInformalInput) {
      finalPrompt = `The user has submitted an informal query: "${userQuestion}". Extract the core medical or laboratory concept beneath the informal phrasing, and deliver a comprehensive, high-clarity academic breakdown of that concept. Prior topic context: ${lastTopic}.`;
    } else {
      finalPrompt = `Provide an exhaustive, high-density academic textbook-grade briefing covering all foundational dimensions, methodologies, clinical insights, and advanced diagnostics for: ${userQuestion}`;
      }
        // --- STAGE 3: EXPERT CLINICAL SYSTEM INSTRUCTIONS ---
    const systemInstruction = `You are an expert clinical intelligence system specialized in Medical Laboratory Science (MLS), pathological analysis, and diagnostic health sciences. Your architecture enforces an objective, rigorous, and neutral tone, matching modern institutional medical AI models.

CRITICAL INLINE MARKUP AND CONTROLS:
- DO NOT use markdown heading tags (do not use '#', '##', or '###').
- DO NOT use any icons, emoticons, or emojis.
- Sections must be demarcated using clean Roman Numerals (e.g., I., II., III., IV., V., VI.) followed by bold headings.
- Bullet points must exclusively utilize simple dashes ('-').
- Use inline bold text ('**text**') on key diagnostics, laboratory parameters, and metrics to ensure clear visual scannability.

REQUIRED CLINICAL BREAKDOWN LAYOUT:
Every medical or laboratory response must follow this structural framework precisely, providing exhaustive, textbook-grade clarity without truncation:

I. Core Definition and Physiological Overview: Establish an authoritative overview of the analyte, biological pathway, or cellular structure with clinical precision.

II. Reference Intervals and Pathological Variances: Present established reference ranges, metrics, and standard international (SI) units. List clear biological variations causing values to elevate or depress.

III. Diagnostic Methodologies and Laboratory Significance: Outline laboratory testing methods, equipment, specimen criteria, potential technical interferences, and analytical interpretation protocols.

IV. Certification Board Examination Traps: Identify exactly 2 advanced diagnostic subtleties, calculation tricks, or differential traps frequently used to test candidates in professional council and licensure examinations.

V. High-Recall Mnemonic Formats: Deliver 1 or 2 direct, professional mnemonic configurations or diagnostic patterns to facilitate immediate retention.

VI. Analytical Synthesis: Conclude with a high-density, 2-to-3 line operational wrap-up detailing the absolute clinical core of the subject.

PROACTIVE ENGAGEMENT SEQUENCE:
Conclude your output exactly with this text block:
"Submit 'more' for an advanced, textbook-grade lecture expansion featuring comprehensive diagnostic breakdowns. Alternatively, indicate if you want to explore a related aspect of this topic."

STRICT SCOPE RESTRAINT:
If an uploaded file or input text lacks clinical diagnostic utility or completely falls outside of MLS, medicine, or health science, state: 'System Restraint: The attached file or query does not contain medical laboratory or clinical health criteria. Please provide an active specimen film, diagnostic chart, or laboratory study asset.'`;
        // --- STAGE 4: ASSEMBLE ARCHITECTURE PAYLOAD ---
    let groqMessages = [{ role: 'system', content: systemInstruction }];

    // Rehydrate conversational thread history for ongoing continuity
    if (history && history.length > 0) {
      history.slice(-10).forEach(msg => {
        groqMessages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content || msg.text || msg.answer || ''
        });
      });
    }

    // Globally optimized model router targeting universally stable regional deployment networks
    const activeModel = attachment ? 'llama-3.2-11b-vision-preview' : 'mixtral-8x7b-32768';

    if (attachment) {
      groqMessages.push({
        role: 'user',
        content: [
          { type: 'text', text: finalPrompt },
          { type: 'image_url', image_url: { url: attachment } }
        ]
      });
    } else {
      groqMessages.push({ role: 'user', content: finalPrompt });
    }

    // --- STAGE 5: EXECUTE INFERENCE ENGINE ---
    const completion = await groq.chat.completions.create({
      model: activeModel,
      messages: groqMessages,
      max_tokens: tokenSize,
      temperature: 0.1
    });

    const generatedOutput = completion.choices.message.content;

    // Return successfully structured response to frontend interface
    return res.status(200).json({
      status: 'online',
      answer: generatedOutput,
      topic: lastTopic || userQuestion
    });

  } catch (error) {
    console.error('System Inference Failure:', error);
    
    // Controlled fallback layout response back to frontend interface containers
    return res.status(500).json({
      error: 'The new app AI endpoint is unavailable for attachments. Deploy api/chat.js and verify GROQ_API_KEY.',
      details: error.message
    });
  }
  }

                      
