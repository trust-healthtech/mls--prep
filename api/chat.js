export default async function handler(req, res) {
  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { question, message, history = [], lastTopic } = req.body;
    const userQuestion = question || message;
    if (!userQuestion) return res.status(400).json({ error: 'No question provided' });

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY missing' });

    const lower = userQuestion.toLowerCase().trim();
    let finalPrompt = userQuestion;
    let tokenSize = 650;

    // --- FIXED SMART DETECTION (no more k/y bug) ---
    const yesExact = ['yes','y','yep','yup','yea','yah','yeh','yess','alright','alrighty','aight','ok','okay','okk','k','kk','sure','bet','great','cool','nice','fine'];
    const yesPhrases = ['sure thing','of course','definitely','absolutely','go ahead','proceed','continue','lets go',"let's go",'go on','why not','do it','show me','tell me'];

    const noExact = ['no','noo','nooo','nope','nah','nahh','nop','nopes','stop','cancel','end','quit','abort','leave','skip','later'];
    const noPhrases = ['not now',"don't",'dont','never mind','nevermind','no thanks','not interested','noo thanks'];

    const moreWords = ['detailed','detail','more','elaborate','deep','full','textbook','comprehensive','expand','breakdown','indepth','further'];

    const isYes = yesExact.includes(lower) || yesPhrases.some(w => lower.includes(w));
    const isNo = noExact.includes(lower) || noPhrases.some(w => lower.includes(w));
    const isMore = moreWords.some(w => lower.includes(w)) || lower.includes('explain more') || lower.includes('need more') || lower.includes('more info');

    if (isMore &&!isYes) {
      tokenSize = 1600;
      finalPrompt = `User wants FULL DETAILED health/MLS explanation for: ${lastTopic || userQuestion}. Provide comprehensive modern textbook answer.`;
    } else if (isYes &&!isMore) {
      tokenSize = 850;
      finalPrompt = `User said YES (said: "${userQuestion}") to continue related health/MLS topic. Last topic: ${lastTopic}. Continue with medium modern explanation of the related subtopic you suggested.`;
    } else if (isNo) {
      return res.status(200).json({
        status: 'online',
        answer: `Got it! 🛑 No problem.\n\nAsk any other MLS or Health question when ready! 🧬\n\n💡 Tip: Type "more" for full version.`
      });
    }

    const recentHistory = history.slice(-10);

    const systemInstruction = `You are TRUST AI LAB ASSISTANT 🧬 - AI for MLS + Health Education ONLY.
LOCKED TO: MLS (Chem Path, Hematology, Microbiology, Histopathology, Blood Bank, Immunology) + All Health/Medicine.
If NOT health/MLS: Reply "🧬 I'm TRUST AI Lab Assistant - I answer only MLS & Health educational questions."
RULES:
1. MEMORY: Use history.
2. DEFAULT: Modern medium 8-10 bullets with headings, emojis, lab values.
3. If user says any more-word: Give FULL textbook answer.
4. After EVERY answer:
💡 Type "more" for full version.

👉 Related: Want to explore "[relevant subtopic]"? Type Yes / No.
5. Related 100% aligned: Kidney->Nephron/GFR/AKI. Liver->LFT etc.
`;

    const messages = [
      { role: 'system', content: systemInstruction },
  ...recentHistory,
      { role: 'user', content: finalPrompt }
    ];

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages,
        temperature: 0.35,
        max_tokens: tokenSize
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Groq error');

    return res.status(200).json({ status: 'online', answer: data.choices[0].message.content });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
      }
