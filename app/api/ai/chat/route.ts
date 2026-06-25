import prisma from "@/lib/prisma";
import { groq } from "@/lib/ai/groq";
import { getKnowledge, safeJsonParse } from "@/lib/ai/knowledge";

export const runtime = "nodejs";

const personality = `
You are a friendly university librarian assistant at UCSTGO.
Style rules:
- Talk like a helpful senior student (friendly, natural Burmese)
- Never robotic or formal
- Light emojis only 🙂
- Do NOT hallucinate books or features not in DB
`;

function cleanJson(text: string) {
  return text
    .replace(/```json|```/g, "") // ✅ FIXED regex
    .trim();
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message?.trim()) {
      return Response.json({
        type: "error",
        answer: "စာတိုအလွတ်ဖြစ်နေပါတယ်နော် 🙂",
        books: [],
      });
    }

    const knowledge = await getKnowledge();

    // ---------------- INTENT ----------------
    const intentRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
Return ONLY JSON:
{
  "intent": "knowledge" | "recommendation" | "summary" | "book_search"
}
          `,
        },
        { role: "user", content: message },
      ],
    });

    const intent = safeJsonParse(
      cleanJson(intentRes.choices[0].message.content || "{}"),
      { intent: "book_search" },
    );

    // ---------------- KNOWLEDGE ----------------
    if (intent.intent === "knowledge") {
      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `
${personality}

Use ONLY this knowledge base:
${knowledge}
            `,
          },
          { role: "user", content: message },
        ],
      });

      return Response.json({
        type: "knowledge",
        answer: res.choices[0].message.content ?? "မသိရှိပါနော် 🙂",
        books: [],
      });
    }

    // ---------------- HANDLING RECOMMENDATIONS ----------------
    if (intent.intent === "recommendation") {
      const dbCategories = await prisma.category.findMany({
        select: { name: true },
      });
      const liveCategoryNames = dbCategories.map((c) => c.name);

      const recommendationAnalysisRes = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
Analyze the user's intent or career choice. Map it strictly into our live database categories or matching search keywords.
OUR REAL-TIME DATABASE CATEGORIES AVAILABLE RIGHT NOW: ${JSON.stringify(liveCategoryNames)}

You must pick 1 to 3 items from the live category list above that best matches their vibe/intent.
Return JSON ONLY: { "categories": string[], "keywords": string[] }
            `,
          },
          { role: "user", content: message },
        ],
      });

      const recConfig = safeJsonParse(
        recommendationAnalysisRes.choices[0].message.content || "",
        { categories: [], keywords: [] },
      );

      let finalBooks = await prisma.book.findMany({
        where: {
          category: {
            name: {
              in: recConfig.categories,
              mode: "insensitive",
            },
          },
        },
        include: { category: true, author: true, copies: true },
        take: 4,
      });

      if (finalBooks.length === 0 && recConfig.keywords.length > 0) {
        finalBooks = await prisma.book.findMany({
          where: {
            OR: recConfig.keywords.map((word: string) => ({
              OR: [
                { title: { contains: word, mode: "insensitive" } },
                { description: { contains: word, mode: "insensitive" } },
              ],
            })),
          },
          include: { category: true, author: true, copies: true },
          take: 4,
        });
      }

      if (finalBooks.length === 0) {
        finalBooks = await prisma.book.findMany({
          include: { category: true, author: true, copies: true },
          orderBy: { createdAt: "desc" },
          take: 3,
        });
      }

      const answerRes = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `
${personality}
CRITICAL OUTPUT DIRECTION FOR USER ENGAGEMENT:
1. Address the user's current mood or dream directly with genuine excitement or comfort (e.g., "ပျင်းနေတာလား ခေါင်းအေးသွားအောင် ဒါလေးတွေဖတ်ကြည့်ပါလား" or "သိပ္ပံပညာရှင်ဖြစ်ချင်တာ တကယ့်ကိုလန်းတဲ့စိတ်ကူးပဲဗျာ!").
2. Speak like a friendly older student advisor. NEVER explain the technical layout of the database or mention words like "category", "database matching", or "system". 
3. You MUST explicitly write down and introduce the book titles and authors from the list below directly within your text response in an attractive, casual style.
4. Keep the presentation neat and easy to read.
            `,
          },
          {
            role: "user",
            content: `User Statement: "${message}"\n\nBooks you MUST introduce and pitch to the user right now:\n${JSON.stringify(
              finalBooks.map((b) => ({
                title: b.title,
                author: b.author?.name || "Unknown",
                description: b.description || "No description available",
              })),
            )}`,
          },
        ],
      });

      return Response.json({
        type: "recommendation",
        answer: answerRes.choices[0].message.content,
        books: finalBooks,
      });
    }

    // ---------------- SUMMARY ----------------
    if (intent.intent === "summary") {
      const book = await prisma.book.findFirst({
        where: {
          OR: [
            { title: { contains: message, mode: "insensitive" } },
            { description: { contains: message, mode: "insensitive" } },
          ],
        },
        include: { author: true, category: true, copies: true },
      });

      if (!book) {
        return Response.json({
          type: "summary",
          answer: "စာအုပ်မတွေ့ပါနော် 🙂",
          books: [],
        });
      }

      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `
${personality}
Summarize ONLY from DB data.
            `,
          },
          {
            role: "user",
            content: `${book.title}\n${book.description}`,
          },
        ],
      });

      return Response.json({
        type: "summary",
        answer: res.choices[0].message.content,
        books: [book],
      });
    }

    // ---------------- SEARCH ----------------
    const books = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: message, mode: "insensitive" } },
          { description: { contains: message, mode: "insensitive" } },
          { category: { name: { contains: message, mode: "insensitive" } } },
        ],
      },
      include: { category: true, author: true, copies: true },
      take: 6,
    });

    return Response.json({
      type: "book_search",
      answer:
        books.length > 0
          ? `${books.length} အုပ် ရှာတွေ့ပါတယ် 🙂`
          : "စာအုပ်မတွေ့ပါဘူး 🙂",
      books,
    });
  } catch (err) {
    console.error(err);
    return Response.json({
      type: "error",
      answer: "စနစ် error ဖြစ်သွားပါတယ် 🙂",
      books: [],
    });
  }
}
