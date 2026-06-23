"use server";

import { groq } from "@/lib/ai/groq";
import prisma from "@/lib/prisma";

type AIResponse = {
  recommendations: string[];
};

export async function recommendBooks(userId: string) {
  try {
    // 1. Get user history
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

    const borrowedBookIds = history.map((h) => h.copy.book.id);

    // 2. 🔥 ONLY PHYSICAL BOOKS = NO EBOOK ENTRY
    const candidates = await prisma.book.findMany({
      where: {
        id: {
          notIn: borrowedBookIds,
        },

        // 🔥 TRUE PHYSICAL FILTER
        copies: {
          some: {
            status: "AVAILABLE",
          },
        },
      },
      include: {
        category: true,
        author: true,
        copies: true,
      },
      take: 50,
    });

    if (candidates.length === 0) return [];

    // 3. AI input (clean physical dataset only)
    const availableBooks = candidates.map((b) => ({
      id: b.id,
      title: b.title,
      category: b.category.name,
      author: b.author.name,
      year: b.publicationYear,
    }));

    const userHistory = history.map((h) => ({
      title: h.copy.book.title,
      category: h.copy.book.category.name,
      author: h.copy.book.author.name,
    }));

    // 4. AI ranking
    const res = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `
You are a university library recommendation engine.

CRITICAL RULES:
- ONLY choose from AVAILABLE_BOOKS
- THESE ARE PHYSICAL BOOKS ONLY
- DO NOT consider ebooks
- RETURN ONLY book IDs

Return JSON:
{ "recommendations": ["id1", "id2", "id3"] }
          `,
        },
        {
          role: "user",
          content: JSON.stringify({
            userHistory,
            availableBooks,
          }),
        },
      ],
      temperature: 0.2,
    });

    const raw = res.choices[0]?.message?.content || "{}";
    const clean = raw.replace(/```json|```/g, "").trim();

    let parsed: AIResponse;

    try {
      parsed = JSON.parse(clean);
    } catch {
      return [];
    }

    if (!Array.isArray(parsed.recommendations)) return [];

    // 5. FINAL SAFETY QUERY
    return prisma.book.findMany({
      where: {
        id: {
          in: parsed.recommendations,
        },

        // STILL ENSURE PHYSICAL ONLY
        ebook: null,
      },
      include: {
        category: true,
        author: true,
      },
    });
  } catch (err) {
    console.error("recommendBooks error:", err);
    return [];
  }
}
