export default async function handler(req, res) {
  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, message, model } = req.body;
    const userQuestion = question || message;

    if (!userQuestion) {
      return res.status(400).json({ error: 'No question provided' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY missing in Vercel' });
    }

    // SMART MEMORY LOGIC
    const isDetailedOnly = userQuestion.toLowerCase().trim() === 'detailed' || userQuestion.toLowerCase().trim() === 'detail';
    const isAskingDetailed = userQuestion.toLowerCase().includes('detailed') || userQuestion.toLowerCase().includes('detail');

    let finalPrompt = userQuestion;
    if (isDetailedOnly) {
      finalPrompt = 'Explain the previous topic we discussed in full detailed textbook style with physiology, causes, clinical significance, tables and exam points.';
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: 'You are TRUST AI LAB ASSISTANT for MLS students in Nigeria. RULES: 1) By default ALWAYS give SHORT, exam-focused answer: max 6 bullet points, direct normal values, steps, causes. No long story. 2) At the VERY END of EVERY short answer, on a new line, ALWAYS add: 💡 Type "detailed" for full detailed explanation. 3) If user asks for detailed/detail/more, then give FULL LONG textbook explanation with tables, physiology, causes, clinical significance. Educational purpose only.'
          },
          { role: 'user', content: finalPrompt }
        ],
        temperature: 0.4,
        max_tokens: isAskingDetailed? 1500 : 500
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error');
    }

    return res.status(200).json({
      status: 'online',
      answer: data.choices[0].message.content
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
