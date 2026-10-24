// api/chat.js - FINAL - Compatible with all frontends
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
    if (!message && !image) return res.status(400).json({ error: 'No message' });

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY missing' });

    const MODEL = "openai/gpt-oss-20b"; // Current free model

    let apiMessages = [
      { role: "system", content: "You are TRUST MLS AI Assistant for Medical Laboratory Science students in Nigeria. Explain lab concepts simply, highlight exam traps, quick recall cues, CBT strategies." }
    ];
    if (Array.isArray(history) && history.length) {
      history.slice(-6).forEach(h => { if (h.content) apiMessages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content }); });
    }
    apiMessages.push({ role: "user", content: message || "Hello" });

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages: apiMessages, temperature: 0.6, max_tokens: 1200 })
    });

    const data = await groqRes.json();
    if (!groqRes.ok) return res.status(groqRes.status).json({ error: data.error?.message });

    const replyText = data.choices?.[0]?.message?.content || data.choices?.[0]?.text || "";

    if (!replyText) return res.status(500).json({ error: `Empty reply from ${MODEL} - raw: ${JSON.stringify(data).slice(0,300)}` });

    // Return EVERY possible field name so frontend finds it
    return res.status(200).json({ 
      reply: replyText,
      answer: replyText,
      response: replyText,
      text: replyText,
      message: replyText,
      content: replyText,
      result: replyText
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
        }
