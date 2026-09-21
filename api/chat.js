export default async function handler(req, res) {
  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question, message, model, lastTopic, lastRelated } = req.body;
    const userQuestion = question || message;
    if (!userQuestion) return res.status(400).json({ error: 'No question provided' });

    const groqKey = process.env.GROQ_API_KEY;
    const lower = userQuestion.toLowerCase().trim();

    // Handle YES / NO logic
    let finalPrompt = userQuestion;
    let isDetailed = lower.includes('detailed');

    if (lower === 'yes' || lower === 'y') {
      finalPrompt = `User said YES to explore the related topic you suggested last. Last topic was: ${lastTopic || 'previous topic'}, Related you suggested was: ${lastRelated || 'related subtopic'}. Now explain that related topic in SHORT bullet form.`;
      isDetailed = false;
    } else if (lower === 'no' || lower === 'n') {
      return res.status(200).json({
        status: 'online',
        answer: `Alright! 👍 Ask any new MLS, chemistry, pathology, or blood bank question when you're ready.\n\n💡 Tip: You can also tap the quick buttons below.`
      });
    } else if (lower === 'detailed' || lower === 'detail') {
      finalPrompt = `Explain in full detailed textbook style with tables, physiology, causes: ${lastTopic || 'the previous topic'}`;
      isDetailed = true;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || 'openai/gpt-oss-20b',
        messages: [
          {
            role: 'system',
            content: `You are TRUST AI LAB ASSISTANT. RULES: 1) Default SHORT answer (max 6 bullets). 2) At end, ALWAYS add exactly 3 lines: Line1: 💡 Type "detailed" for full detailed explanation. Line2: blank line. Line3: 👉 Related: Want to explore "[1 related subtopic name here]"? Type Yes / No. 3) Related topic must be very relevant to current question. 4) If user asks detailed, give LONG textbook answer. Educational only.`
          },
          { role: 'user', content: finalPrompt }
        ],
        temperature: 0.4,
        max_tokens: isDetailed? 1500 : 600
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message);

    return res.status(200).json({ status: 'online', answer: data.choices[0].message.content });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
        }
