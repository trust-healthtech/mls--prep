// api/chat.js - TRUST MLS AI Assistant - Fixed for 2026 Groq models
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, history, image } = req.body;

    if (!message && !image) {
      return res.status(400).json({ error: 'No message provided' });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!groqKey && !geminiKey) {
      return res.status(500).json({ error: 'No API keys configured in Vercel' });
    }

    // System prompt for MLS
    const systemPrompt = `You are TRUST MLS AI Assistant. You help MLS (Medical Laboratory Science) students in Nigeria.
Explain laboratory concepts simply, highlight exam traps, offer quick recall cues and CBT speed strategies.
Be concise, accurate, and encouraging. Use emojis sparingly.
If user uploads study material image, explain it clearly.`;

    let messages = [
      { role: "system", content: systemPrompt }
    ];

    // Add history if provided (last 6 messages)
    if (history && Array.isArray(history)) {
      history.slice(-6).forEach(h => {
        messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.content });
      });
    }

    // Current user message
    let userContent = message || "Please explain this attached study material.";

    // Handle image with Groq Vision
    let modelToUse = "llama-3.3-70b-versatile"; // Latest text model

    if (image) {
      // Use vision-capable model for images
      modelToUse = "meta-llama/llama-4-scout-17b-16e-instruct";
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userContent },
          { type: "image_url", image_url: { url: image } }
        ]
      });
    } else {
      messages.push({ role: "user", content: userContent });
    }

    // Try GROQ first
    if (groqKey) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: messages.filter(m => m.role !== 'system').length ? 
              [{ role: "system", content: systemPrompt }, ...messages.filter(m => m.role !== 'system')] : messages,
            temperature: 0.7,
            max_tokens: 1024
          })
        });

        const data = await groqRes.json();

        if (!groqRes.ok) {
          // If vision model fails, retry with text model
          if (data.error && data.error.code === 'model_not_found') {
            throw new Error(`Groq model error: ${data.error.message}. Trying fallback.`);
          }
          throw new Error(data.error?.message || `Groq error ${groqRes.status}`);
        }

        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return res.status(200).json({ reply, provider: "groq", model: modelToUse });
        }
      } catch (groqError) {
        console.error("Groq failed:", groqError.message);
        // If image caused failure, try text-only fallback
        if (image && groqKey) {
           try {
             const fallbackRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
               method: "POST",
               headers: { "Authorization": `Bearer ${groqKey}`, "Content-Type": "application/json" },
               body: JSON.stringify({
                 model: "llama-3.3-70b-versatile",
                 messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent + " (Note: image was attached but vision model unavailable, answer based on text)" }],
                 temperature: 0.7,
                 max_tokens: 1024
               })
             });
             const fallbackData = await fallbackRes.json();
             if (fallbackRes.ok && fallbackData.choices?.[0]?.message?.content) {
               return res.status(200).json({ reply: fallbackData.choices[0].message.content, provider: "groq-fallback" });
             }
           } catch(e) {}
        }
        // Continue to Gemini if Groq fails and we have Gemini key
        if (!geminiKey) {
          return res.status(500).json({ error: `AI provider error: ${groqError.message}. Please check Vercel API and model configuration.` });
        }
      }
    }

    // Gemini fallback (if you later add key)
    if (geminiKey) {
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\nUser: " + userContent }] }]
        })
      });
      const geminiData = await geminiRes.json();
      const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (reply) return res.status(200).json({ reply, provider: "gemini" });
    }

    return res.status(500).json({ error: "All AI providers failed" });

  } catch (err) {
    console.error("chat.js error:", err);
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
  }
