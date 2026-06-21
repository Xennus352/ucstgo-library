"use server";

import { Semester } from "@/app/generated/prisma/enums";
import { groq } from "@/lib/ai/groq";
import prisma from "@/lib/prisma";


export async function aiSearchBooks(query: string) {
  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `
Convert the user's library search query into structured JSON filters.

IMPORTANT ENUM RULES FOR SEMESTER:
- "sem 1" or "semester 1" = "Y1_SEM1"
- "sem 2" or "semester 2" = "Y1_SEM2"
- "year 2 sem 1" = "Y2_SEM1"
- "year 2 sem 2" = "Y2_SEM2"
- "year 3 sem 1" = "Y3_SEM1"
- "year 3 sem 2" = "Y3_SEM2"
- "year 4 sem 1" = "Y4_SEM1"
- "year 4 sem 2" = "Y4_SEM2"

Return ONLY a raw JSON object string matching this schema exactly:
{
  "title": string|null,
  "category": string|null,
  "author": string|null,
  "semester": "Y1_SEM1" | "Y1_SEM2" | "Y2_SEM1" | "Y2_SEM2" | "Y3_SEM1" | "Y3_SEM2" | "Y4_SEM1" | "Y4_SEM2" | null
}
        `,
      },
      { role: "user", content: query },
    ],
    temperature: 0.2,
  });

  const raw = res.choices[0].message.content || "{}";
  const clean = raw.replace(/```json|```/g, "").trim();

  let filters;
  try {
    filters = JSON.parse(clean);
  } catch (err) {
    console.error("Failed to parse AI JSON:", clean);
    filters = {};
  }

  // Build the dynamic where clause ensuring loose text checking (insensitive) across relations
  return prisma.book.findMany({
    where: {
      // 1. Loose check on title
      title: filters.title
        ? { contains: filters.title, mode: "insensitive" }
        : undefined,

      // 2. Case-insensitive relation filtering for category
      category: filters.category
        ? { name: { contains: filters.category, mode: "insensitive" } }
        : undefined,

      // 3. Case-insensitive relation filtering for author
      author: filters.author
        ? { name: { contains: filters.author, mode: "insensitive" } }
        : undefined,

      // 4. Checking if nested eBook matching the semester exists
      ebook: filters.semester
        ? { semester: filters.semester as Semester }
        : undefined,
    },
    // Required structure fields expected by your client-side <SearchSection /> UI component
    include: {
      category: true,
      author: true,
      ebook: true,
    },
  });
}
