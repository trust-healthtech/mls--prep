import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { question, history } = req.body;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert Medical Laboratory Scientist (MLS) and instructor. Answer technical health and laboratory questions accurately, providing structured breakdowns."
        },
        ...(history || [])
      ],
      temperature: 0.3
    });

    return res.status(200).json({ answer: response.choices.message.content });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
    }
