"use server";

import { groq } from "@/lib/ai/groq";

export async function summarizeBook(text: string) {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `
You are a university book assistant. Analyze the text provided and return a structured analysis.

Return ONLY JSON matching this schema:
{
  "summary": "A concise paragraph summarizing the book.",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "difficultyLevel": "Beginner" | "Intermediate" | "Advanced"
}
        `,
      },
      {
        role: "user",
        content: text.slice(0, 20000),
      },
    ],
    temperature: 0.3,
  });

  const rawContent = res.choices[0].message.content || "{}";
  const cleanJson = rawContent.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanJson);
}
