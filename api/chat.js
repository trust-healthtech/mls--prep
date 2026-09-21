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
    let tokenSize = 900;

    // PRO YES / NO / MORE / PIDGIN - UNRESTRICTED
    const yesExact = ['yes','y','yep','yup','yea','yah','yeh','yess','yeah','ya','alright','alrighty','aight','ok','okay','okk','k','kk','sure','bet','great','cool','nice','fine','okay na','yes o','yes oo','yes now','yupz'];
    const yesPhrases = ['sure thing','of course','definitely','absolutely','go ahead','proceed','continue','lets go',"let's go",'go on','why not','do it','show me','tell me','explain','i want','abeg','make you','na yes','yes abeg','teach me','lecture me'];
    const noExact = ['no','noo','nooo','nope','nah','nahh','nop','nopes','stop','cancel','end','quit','abort','leave','skip','later','no o','no oo'];
    const noPhrases = ['not now',"don't",'dont','never mind','nevermind','no thanks','not interested','noo thanks','make e no','leave am'];
    const moreWords = ['detailed','detail','more','elaborate','deep','full','textbook','comprehensive','expand','breakdown','indepth','further','exam trap','exam hack','hack','simplify','simple english','lecture'];
    const pidginWords = ['abeg','wetin','wey','dey','na','shey','how far','no sabi','i no understand','no understand','break am','pidgin','pijin','no too clear','e no clear'];

    const isYes = yesExact.includes(lower) || yesPhrases.some(w => lower.includes(w));
    const isNo = noExact.includes(lower) || noPhrases.some(w => lower.includes(w));
    const isMore = moreWords.some(w => lower.includes(w)) || lower.includes('explain more') || lower.includes('need more') || lower.includes('more info');
    const isPidginInput = pidginWords.some(w => lower.includes(w));

    if (isMore &&!isYes) {
      tokenSize = 2000;
      finalPrompt = `User wants FULL PRO LECTURE with EXAM TRAPS + EXAM HACKS for: ${lastTopic || userQuestion}. Give detailed textbook + traps + hacks + simple English breakdown.`;
    } else if (isYes &&!isMore) {
      tokenSize = 1100;
      finalPrompt = `User said YES (said: "${userQuestion}") to continue. Last topic: ${lastTopic}. If last bot message asked about Pidgin and user said YES, switch to Pidgin + MLS terms now. Otherwise continue related subtopic with trap + hack included.`;
    } else if (isNo) {
      return res.status(200).json({
        status: 'online',
        answer: `Got it! 🛑 No wahala!\n\nAsk any other MLS, Health or AI question when ready! 🧬\n\n💡 Tip: Type "more" for full lecture + exam traps & hacks.`
      });
    } else if (isPidginInput) {
      finalPrompt = `User speaks Pidgin/Broken: "${userQuestion}". Last topic: ${lastTopic}. Handle per Pidgin rule in system instruction.`;
    }

    const recentHistory = history.slice(-12);

    const systemInstruction = `You are TRUST AI LAB ASSISTANT - Global Pro Lecturer AI for MLS, Health, AI, Use of English.

LANGUAGE RULE:
1. Default = Simple clean English.
2. If user types Pidgin/Broken like "abeg, wetin, no understand, break am", first explain in simple English, then ASK: "Would you like me to explain this in Pidgin so you understand better? Type Yes or No."
3. If YES to Pidgin → Switch to Pidgin + correct MLS terms (terms stay English, explanation in Pidgin). Eg: "Neutrophils na first soldiers wey dey fight bacteria infection."
4. If NO → Continue in simple English.
5. If user says "explain in pidgin" → Go straight to Pidgin.

FORMATTING - NEVER USE ### or ##:
Use ONLY: 1️⃣ 2️⃣ 3️⃣ for headings, - for bullets, **bold** for key terms. No hashtags.

PRO LECTURER STRUCTURE - FOR EVERY ANSWER YOU MUST INCLUDE:

1️⃣ Definition / Overview
- Simple English explanation + correct MLS term

2️⃣ Key Points / Types / Causes / Normal Values
- 4-6 bullets with lab values where needed

3️⃣ Clinical / Lab Significance
- Why it matters in lab

4️⃣ ⚠️ EXAM TRAP ALERT: (MANDATORY - ALWAYS)
- Show 2 most common traps examiners set for this topic + correct answer
Format:
⚠️ EXAM TRAP ALERT:
Trap 1: [trap question] → Answer: [correct] Why examiners trap you.
Trap 2: [trap question] → Answer: [correct]

5️⃣ 🧠 EXAM HACK / MEMORY TRICK: (MANDATORY - ALWAYS)
- Give 1-2 mnemonics, shortcuts, or hack to remember it fast in exam hall
Format:
🧠 EXAM HACK: [mnemonic/trick]

6️⃣ Simple English Summary
- In one line: "In simple English, it means..."

End with:
💡 Type "more" for full textbook lecture + more traps & hacks.
👉 Related: Want to explore "[relevant subtopic]"? Type Yes / No.

ALLOWED: MLS, Health, Medicine, AI basics, Use of English. If outside, politely redirect in English.

TONE: Like best university lecturer - friendly, clear, makes students pass. Use small 🧬🔬📚.
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
        temperature: 0.38,
        max_tokens: tokenSize
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Groq error');

    let cleanAnswer = data.choices[0].message.content
     .replace(/###/g, '')
     .replace(/##/g, '')
     .replace(/^#+\s/gm, '')
     .trim();

    return res.status(200).json({ status: 'online', answer: cleanAnswer });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
                     }
