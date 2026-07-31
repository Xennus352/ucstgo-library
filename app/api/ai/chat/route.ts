import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { getGroqClient } from "@/lib/ai/groq";
import { getKnowledge, safeJsonParse } from "@/lib/ai/knowledge";
import { auth } from "@/lib/auth";
import { Prisma } from "@/app/generated/prisma/client";

export const runtime = "nodejs";

let groq: ReturnType<typeof getGroqClient> | null = null;

// Type helper so TypeScript recognizes relational fields from Prisma includes
type BookWithRelations = Prisma.BookGetPayload<{
  include: {
    category: true;
    author: true;
    copies: { select: { status: true } };
    ebook: {
      select: { id: true; format: true; filePath: true; accessType: true };
    };
  };
}>;

// Helper to determine the correct Burmese honorific prefix based on role
function getRoleHonorific(role?: string): {
  honorific: string;
  title: string;
  idCardLabel: string;
} {
  switch (role) {
    case "LECTURER":
    case "ADMIN":
    case "LIBRARIAN":
      return {
        honorific: "ဆရာ",
        title: "Lecturer/Admin/Librarian",
        idCardLabel: "Staff ID (ဝန်ထမ်းကတ်)",
      };
    case "STUDENT":
    default:
      return {
        honorific: "ကလေး",
        title: "Student",
        idCardLabel: "Student ID (ကျောင်းသားကတ်)",
      };
  }
}

export async function POST(req: Request) {
  try {
    if (!groq) groq = getGroqClient();

    // 1. Retrieve Current Session & Determine User Role
    const session = await auth.api.getSession({ headers: req.headers });
    const userRole = session?.user?.role || "STUDENT";
    const userName = session?.user?.name || "ကျောင်းသား";
    const { honorific, idCardLabel } = getRoleHonorific(userRole);

    const { message, history = [] } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({
        type: "error",
        answer: `စာတိုအလွတ်ဖြစ်နေပါတယ်နော် ${honorific} 🙂`,
        books: [],
      });
    }

    const knowledgeBase = await getKnowledge();

    // Dynamic Persona System Rule based on Role
    const personalityPrompt = `
You are a real-time AI Library Assistant at UCSTGO Digital Library (University of Computer Studies, Taungoo).

Target User:
- Name: ${userName}
- Role: ${userRole}
- Honorific: "${honorific}"

ROLE
You are a friendly, knowledgeable senior student assistant helping users use the UCSTGO Digital Library. Your job is to help users find books, answer library-related questions, explain borrowing procedures, and provide accurate information from the available library database and context.

TONE & PERSONALITY
1. Speak natural, warm, conversational Burmese.
2. Sound like a respectful senior student helping juniors, not a robotic chatbot.
3. Always be polite, approachable, and encouraging.
4. Use only light emojis when appropriate (🙂).
5. Keep responses concise unless the user asks for detailed explanations.
6. ALWAYS speak in natural, colloquial Burmese as spoken in Myanmar universities.
7. NEVER use direct machine-translated phrases like "လာဘ်ကြည့်ရင်", "လှည့်လည် ဖတ်ချင်ရင်", or "ဘာမျှ မေးစရာ မရှိပါဘူး".
8. Keep greetings simple, warm, and natural.
   - Good Greeting Example: "မင်္ဂလာပါနော် ${honorific} 🙂 UCSTGO စာကြည့်တိုက်ကနေ ကြိုဆိုပါတယ်။ ဘာစာအုပ်များ ကူညီရှာပေးရမလဲဗျ?"
   - Bad Greeting Example: "ဆရာ ဘာကူညီပေးရမလဲ 🙂 လာဘ်ကြည့်ရင်..." (NEVER SAY THIS)
9. Address the user naturally using "${honorific}".

ADDRESSING THE USER
1. ALWAYS address the user using "${honorific}" naturally.
2. Examples:
   - "${honorific} ဘာကူညီပေးရမလဲ 🙂"
   - "${honorific} ရှာနေတဲ့ စာအုပ်လေး တွေ့ထားပါတယ်နော် 🙂"
   - "${honorific} အတွက် ဒီစာအုပ်တွေ ရှာတွေ့ထားပါတယ်။"

LIBRARY CONTEXT
1. This assistant belongs ONLY to the UCSTGO Digital Library.
2. Never invent or mention external library names or services unless the user explicitly asks to compare with them.
3. Never pretend books, authors, shelves, copies, or digital resources exist if they are not provided by the database or context.
4. If information is unavailable, state that honestly instead of guessing.

PHYSICAL BOOK RULES
1. If a physical book is available, tell the user they can borrow it from the UCSTGO library counter.
2. Mention that borrowing requires ${idCardLabel}.
3. Never mention any other form of verification card (e.g. do NOT tell ${honorific} to bring a student card if ${honorific} is a staff member).
4. Do not invent borrowing policies beyond the provided context.

RESPONSE GUIDELINES
1. Base every answer on the provided database, retrieved context, or system information.
2. If multiple books match, recommend the most relevant ones first.
3. When no result exists, politely explain that nothing matching the request was found and suggest related keywords if appropriate.
4. If clarification is needed, ask a short follow-up question before making assumptions.

STRICT RULES
- Never fabricate books, authors, availability, borrowing status, or library features.
- Never claim real-time information unless it is provided.
- Never break character as the UCSTGO Digital Library Assistant.
- Always maintain a respectful, warm, and helpful Burmese conversation.
`;

    // ---------------- STEP 1: INTENT & KEYWORD CLASSIFICATION ----------------
    const classificationRes = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
Analyze the user's message and return ONLY JSON:
{
  "intent": "chitchat" | "knowledge" | "bored_recommendation" | "book_search" | "summary" | "ebook_browse",
  "keywords": string[]
}

Intent guide:
- "ebook_browse": User asks generally about available e-books (e.g. "what e-book can i read", "show me ebooks", "Ebook ဘာတွေဖတ်လို့ရမလဲ").
- "bored_recommendation": User expresses boredom (e.g. "ပျင်းလို့", "im bored"), asks for popular/top books, or wants general recommendations.
- "book_search": User searches for specific topics, physical books, or ebooks.
- "knowledge": Questions regarding UCSTGO library regulations, hours, fines, or facilities.
- "summary": Asking for a synopsis or summary of a specific book.
- "chitchat": Small talk, greetings ("မင်္ဂလာပါ"), or general banter.
          `,
        },
        { role: "user", content: message },
      ],
    });

    const { intent, keywords } = safeJsonParse(
      classificationRes.choices[0]?.message?.content || "{}",
      { intent: "chitchat", keywords: [] }
    );

    const searchTerms = keywords.length > 0 ? keywords : [message];

    // Allowed Ebook Access Array based on user role
    const allowedEbookAccess =
      userRole === "ADMIN"
        ? ["OPEN", "STUDENT_ONLY", "LECTURER_ONLY", "ADMIN_ONLY"]
        : userRole === "LECTURER"
        ? ["OPEN", "STUDENT_ONLY", "LECTURER_ONLY"]
        : ["OPEN", "STUDENT_ONLY"];

    // ---------------- STEP 2: ROUTE INTENTS ----------------

    // --- CASE A: CHITCHAT / GREETINGS ---
    if (intent === "chitchat") {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        messages: [
          { role: "system", content: personalityPrompt },
          ...history.slice(-4),
          { role: "user", content: message },
        ],
      });

      return NextResponse.json({
        type: "chitchat",
        answer: response.choices[0]?.message?.content || `မင်္ဂလာပါနော် ${honorific} 🙂`,
        books: [],
      });
    }

    // --- CASE B: LIBRARY KNOWLEDGE BASE ---
    if (intent === "knowledge") {
      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `${personalityPrompt}\n\nUse ONLY this official library rules & knowledge text:\n${knowledgeBase}`,
          },
          { role: "user", content: message },
        ],
      });

      return NextResponse.json({
        type: "knowledge",
        answer: response.choices[0]?.message?.content || `မသိရှိပါနော် ${honorific} 🙂`,
        books: [],
      });
    }

    // --- CASE C: GENERAL E-BOOK BROWSE ---
    if (intent === "ebook_browse") {
      const ebookBooks = (await prisma.book.findMany({
        where: {
          ebook: {
            isNot: null,
           is: {
              accessType: { in: allowedEbookAccess as any },
            },
          },
        },
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          author: true,
          copies: { select: { status: true } },
          ebook: {
            select: { id: true, format: true, filePath: true, accessType: true },
          },
        },
      })) as BookWithRelations[];

      if (ebookBooks.length === 0) {
        return NextResponse.json({
          type: "ebook_browse",
          answer: `လက်ရှိမှာ ${honorific} ဖတ်ရှုလို့ရတဲ့ အီးဘွတ် (E-book) မရှိသေးပါဘူးနော် 🙂`,
          books: [],
        });
      }

      const formattedEbooks = ebookBooks.map((b) => ({
        title: b.title,
        author: b.author?.name || "Unknown",
        category: b.category?.name || "General",
        format: b.ebook?.format,
      }));

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        messages: [
          {
            role: "system",
            content: `${personalityPrompt}\nPresent these available E-books to ${honorific} warmly. Mention that they can read them online directly in the app.`,
          },
          {
            role: "user",
            content: `User query: "${message}"\nAvailable E-books in DB: ${JSON.stringify(
              formattedEbooks
            )}`,
          },
        ],
      });

      return NextResponse.json({
        type: "ebook_browse",
        answer: response.choices[0]?.message?.content,
        books: ebookBooks,
      });
    }

    // --- CASE D: BORED / TOP RECOMMENDATIONS ---
    if (intent === "bored_recommendation") {
      const topBooks = (await prisma.book.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          author: true,
          copies: { select: { status: true } },
          ebook: {
            select: { id: true, format: true, filePath: true, accessType: true },
          },
        },
      })) as BookWithRelations[];

      if (topBooks.length === 0) {
        return NextResponse.json({
          type: "recommendation",
          answer: `စိတ်မညစ်ပါနဲ့နော် ${honorific} 🙂 လက်ရှိမှာ စာကြည့်တိုက်ထဲ စာအုပ်အသစ်တွေ ထပ်ဖြည့်ဖို့ ပြင်ဆင်နေပါတယ်ဗျ။`,
          books: [],
        });
      }

      const formattedTopBooks = topBooks.map((b) => {
        const isValidEbook =
          b.ebook && (allowedEbookAccess as string[]).includes(b.ebook.accessType);
        return {
          title: b.title,
          author: b.author?.name || "မသိရှိပါ",
          category: b.category?.name || "အထွေထွေ",
          hasEbook: Boolean(isValidEbook),
          availableCopies: b.copies.filter((c) => c.status === "AVAILABLE").length,
        };
      });

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.4, // Reduced temperature to stop output hallucination
        messages: [
          {
            role: "system",
            content: `
${personalityPrompt}

CRITICAL RULES FOR RECOMMENDATIONS:
1. Express natural empathy for ${honorific} feeling bored (e.g. "ပျင်းနေရင် စာအုပ်လေးတွေ ဖတ်ကြည့်ပါလား 🙂").
2. STRICT REQUIREMENT: You MUST ONLY mention books that exist in the provided "Available Books DB Payload". NEVER invent or guess book titles like "Human Computer Interaction".
3. ONLY refer to physical borrowing using ${idCardLabel}. Never use direct translated words like "အမှတ်တရ ကဒ်".
4. List 2 to 3 titles from the DB list with warm, encouraging Burmese description.
            `,
          },
          {
            role: "user",
            content: `User query: "${message}"\n\nAvailable Books DB Payload:\n${JSON.stringify(
              formattedTopBooks
            )}`,
          },
        ],
      });

      return NextResponse.json({
        type: "recommendation",
        answer: response.choices[0]?.message?.content,
        books: topBooks,
      });
    }

    // --- CASE E: BOOK & EBOOK SEARCH ---
    const searchResults = (await prisma.book.findMany({
      where: {
        OR: searchTerms.flatMap((term: string) => [
          { title: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { category: { name: { contains: term, mode: "insensitive" } } },
          { author: { name: { contains: term, mode: "insensitive" } } },
        ]),
      },
      take: 6,
      include: {
        category: true,
        author: true,
        copies: { select: { status: true } },
        ebook: {
          select: { id: true, format: true, filePath: true, accessType: true },
        },
      },
    })) as BookWithRelations[];

    const formattedSearchResults = searchResults.map((b) => {
      const isValidEbook =
        b.ebook && (allowedEbookAccess as string[]).includes(b.ebook.accessType);
      return {
        title: b.title,
        author: b.author?.name || "Unknown",
        availableCopies: b.copies.filter((c) => c.status === "AVAILABLE").length,
        hasEbook: Boolean(isValidEbook),
      };
    });

    const searchResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `${personalityPrompt}\nSummarize search results for ${honorific}. Mention whether digital E-books are available to read online or if physical copies are ready for borrowing.`,
        },
        {
          role: "user",
          content: `Query: "${message}"\nFound items: ${JSON.stringify(
            formattedSearchResults
          )}`,
        },
      ],
    });

    return NextResponse.json({
      type: "book_search",
      answer: searchResponse.choices[0]?.message?.content,
      books: searchResults,
    });
  } catch (err) {
    console.error("AI Chat Handler Error:", err);
    return NextResponse.json({
      type: "error",
      answer: "စနစ်အနည်းငယ် ချို့ယွင်းနေလို့ ခဏနေမှ ပြန်ကြိုးစားပေးပါနော် 🙂",
      books: [],
    });
  }
}