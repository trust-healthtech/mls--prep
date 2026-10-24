// api/chat.js - FINAL with Vision Support
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
    const image = body.image || body.imageBase64 || body.file || null;
    const history = body.history || [];
    if (!message && !image) return res.status(400).json({ error: 'No message' });

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY missing' });

    const systemPrompt = "You are TRUST MLS AI Assistant for Medical Lab Science students in Nigeria. Explain concepts simply, highlight exam traps, give quick recall cues.";

    // Choose model: Vision if image, text if no image
    let model = image ? "meta-llama/llama-4-scout-17b-16e-instruct" : "openai/gpt-oss-20b";
    
    let apiMessages = [{ role: "system", content: systemPrompt }];
    if (Array.isArray(history) && history.length) {
      history.slice(-6).forEach(h => { if (h.content) apiMessages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content }); });
    }

    if (image) {
      // Vision format
      apiMessages.push({
        role: "user",
        content: [
          { type: "text", text: message || "Please explain this attached study material. Explain what you see, key concepts, exam traps." },
          { type: "image_url", image_url: { url: image } }
        ]
      });
    } else {
      apiMessages.push({ role: "user", content: message });
    }

    let groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: apiMessages, temperature: 0.6, max_tokens: 1500 })
    });

    let data = await groqRes.json();

    // If vision model fails, try qwen vision model (free backup)
    if (!groqRes.ok && image) {
      model = "qwen/qwen3-32b";
      apiMessages[apiMessages.length-1] = {
        role: "user",
        content: [
          { type: "text", text: message || "Explain this study material" },
          { type: "image_url", image_url: { url: image } }
        ]
      };
      groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: apiMessages, temperature: 0.6, max_tokens: 1500 })
      });
      data = await groqRes.json();
    }

    // If vision still fails, fallback to text-only explanation
    if (!groqRes.ok && image) {
      const fallbackRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `${message || "Explain study material"} (User uploaded image ${body.fileName || ''}. If you can't see it, explain general concept and ask user to type text from image)` }],
          temperature: 0.6, max_tokens: 1200
        })
      });
      const fbData = await fallbackRes.json();
      if (fallbackRes.ok) {
        const txt = fbData.choices?.[0]?.message?.content;
        return res.status(200).json({ reply: txt, answer: txt, response: txt, text: txt, message: txt });
      }
    }

    if (!groqRes.ok) return res.status(groqRes.status).json({ error: data.error?.message });

    const replyText = data.choices?.[0]?.message?.content || "";
    if (!replyText) return res.status(500).json({ error: 'Empty reply' });

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
