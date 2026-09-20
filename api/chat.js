export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({ status: "TRUST AI API is Live! Use POST method." });
  }

  if (req.method!== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, history } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question required" });
    }

    const GROQ_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY missing in Vercel" });
    }

    const messages = [
      { role: "system", content: "You are TRUST AI LAB ASSISTANT, an expert Medical Laboratory Science tutor. Answer clearly, clinically, for MLS students. Use simple formatting. No ** stars overload." },
     ...(Array.isArray(history)? history.slice(-10) : []),
      { role: "user", content: question }
    ];

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      console.error("Groq error:", data);
      return res.status(500).json({ error: "Groq API failed", details: data });
    }

    const answer = data.choices?.[0]?.message?.content || "No answer generated.";

    return res.status(200).json({ answer: answer });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
                                }

