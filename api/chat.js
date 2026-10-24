// api/chat.js - TRUST MLS AI - Final Fix
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    }
    body = body || {};

    // Accept ANY field name your frontend uses
    const message = body.message || body.prompt || body.question || body.content || body.text || body.query || "";
    const image = body.image || body.imageBase64 || body.file || body.attachment || null;
    const history = body.history || [];

    if (!message && !image) {
      return res.status(400).json({ error: `No message provided - received keys: ${Object.keys(body).join(', ')}` });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY not set in Vercel' });

    const systemPrompt = `You are TRUST MLS AI Assistant for Medical Laboratory Science students in Nigeria. Explain lab concepts simply, highlight exam traps, quick recall cues, CBT speed strategies.`;

    let modelToUse = image ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile";

    let apiMessages = [{ role: "system", content: systemPrompt }];
    
    if (Array.isArray(history) && history.length) {
      history.slice(-6).forEach(h => {
        if (h.content) apiMessages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content });
      });
    }

    if (image) {
      apiMessages.push({
        role: "user",
        content: [
          { type: "text", text: message || "Explain this study material" },
          { type: "image_url", image_url: { url: image } }
        ]
      });
    } else {
      apiMessages.push({ role: "user", content: message });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelToUse,
        messages: apiMessages,
        temperature: 0.6,
        max_tokens: 1200
      })
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      // Try fallback to text model if vision fails
      if (image && modelToUse.includes('scout')) {
        const fallback = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: message || "Explain attached material (image was uploaded)" }],
            temperature: 0.6,
            max_tokens: 1200
          })
        });
        const fbData = await fallback.json();
        if (fallback.ok && fbData.choices?.[0]?.message?.content) {
          return res.status(200).json({ reply: fbData.choices[0].message.content });
        }
      }
      return res.status(groqRes.status).json({ error: `Groq error: ${data.error?.message || JSON.stringify(data)}` });
    }

    const reply = data.choices?.[0]?.message?.content;
    return res.status(200).json({ reply });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
