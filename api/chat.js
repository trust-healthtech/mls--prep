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
    let tokenSize = 600;

    if (lower === 'yes' || lower === 'y' || lower === 'continue') {
      tokenSize = 800;
      finalPrompt = `User said YES to continue. Last topic: ${lastTopic}. Give MEDIUM detailed explanation (8-10 bullets, causes, lab values) about the related subtopic you suggested in last answer.`;
    } else if (lower === 'no' || lower === 'n' || lower === 'stop') {
      return res.status(200).json({
        status: 'online',
        answer: `Got it! 🛑 Stopped.\n\nAsk any new MLS question when ready.\n\n💡 Tip: Type "detailed" anytime for full textbook version.`
      });
    } else if (lower === 'detailed' || lower === 'detail') {
      tokenSize = 1500;
      finalPrompt = `User wants DETAILED textbook explanation for: ${lastTopic || 'previous topic'}. Full detailed with tables.`;
    }

    const recentHistory = history.slice(-8);

    const systemInstruction = `You are TRUST AI LAB ASSISTANT with RETENTIVE MEMORY.
RULES:
1. You HAVE MEMORY - use history.
2. DEFAULT: MEDIUM detailed (8-10 bullets, definition, causes, types, lab features).
3. After EVERY answer add:
💡 Type "detailed" for full textbook version.

👉 Related: Want to explore "[relevant subtopic]"? Type Yes / No.
4. Related MUST align 100% with current topic. Kidney->Nephron/GFR/AKI. Liver->LFT.
5. If user says YES, give MEDIUM explanation of that related topic.`;

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
        temperature: 0.4,
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
