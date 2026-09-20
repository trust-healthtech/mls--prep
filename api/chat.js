export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'No question provided' });
  }

  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) {
    return res.status(200).json({
      status: 'offline',
      answer: 'Offline mode - GROQ_API_KEY not set in Vercel.'
    });
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: 'You are TRUST AI Lab Assistant. Expert in MLS, chemistry, pathology, hematology. Explain clearly for students. Educational only.' },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 1000
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
    return res.status(200).json({
      status: 'offline',
      answer: `Groq failed: ${error.message}`,
      error: error.message
    });
  }
}
