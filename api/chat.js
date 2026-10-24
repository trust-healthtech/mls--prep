// api/chat.js - FINAL WORKING VERSION - Uses Free Groq models
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }
    body = body || {};
    const message = body.message || body.prompt || body.question || body.content || body.text || body.query || "";
    const image = body.image || body.imageBase64 || null;
    const history = body.history || [];

    if (!message && !image) {
      return res.status(400).json({ error: 'No message provided' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY missing in Vercel' });

    const systemPrompt = "You are TRUST MLS AI Assistant for Medical Laboratory Science students in Nigeria. Explain lab concepts simply, highlight exam traps, quick recall cues, CBT strategies. Be helpful and concise.";

    // FREE MODEL THAT WORKS IN 2026
    const MODEL = "openai/gpt-oss-20b"; // Free tier, 1000 rpm, works for all free keys

    let apiMessages = [
      { role: "system", content: systemPrompt }
    ];
    
    if (Array.isArray(history) && history.length) {
      history.slice(-6).forEach(h => {
        if (h.content) apiMessages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content });
      });
    }

    const userText = message || "Explain this study material";
    apiMessages.push({ role: "user", content: image ? `${userText} (User uploaded an image - explain based on text, say you can't see image clearly but answer question)` : userText });

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: apiMessages,
        temperature: 0.6,
        max_tokens: 1200
      })
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      return res.status(groqRes.status).json({ error: `Groq error: ${data.error?.message || JSON.stringify(data)} - Model: ${MODEL}` });
    }

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) return res.status(500).json({ error: 'Empty response from Groq' });

    return res.status(200).json({ reply, model: MODEL });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
      }
