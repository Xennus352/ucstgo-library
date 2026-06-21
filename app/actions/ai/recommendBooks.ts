"use server";

import { groq } from "@/lib/ai/groq";
import prisma from "@/lib/prisma";

export async function recommendBooks(userId: string) {
  const history = await prisma.borrowRecord.findMany({
    where: { userId },
    include: {
      copy: {
        include: {
          book: {
            include: {
              category: true,
              author: true,
            },
          },
        },
      },
    },
  });

  const simplified = history.map((h) => ({
    title: h.copy.book.title,
    category: h.copy.book.category.name,
  }));

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `
Recommend books based on history.

Return ONLY JSON:
{ "recommendations": string[] }
        `,
      },
      {
        role: "user",
        content: JSON.stringify(simplified),
      },
    ],
    temperature: 0.4,
  });

  const rawContent = res.choices[0].message.content || "{}";
  const cleanJson = rawContent.replace(/```json|```/g, "").trim();
  const result = JSON.parse(cleanJson);

  return prisma.book.findMany({
    where: {
      title: { in: result.recommendations },
    },
  });
}
