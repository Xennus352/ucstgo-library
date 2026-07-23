import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import path, { join } from "path";
import { mkdir, writeFile } from "fs/promises";
import crypto from "crypto";
import {
  FILE_LIMITS,
  validateContentLength,
  validateFileSize,
} from "@/lib/upload";

// ========================================================
// GET: /api/books/lecturer -> Fetch current lecturer's books
// ========================================================

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the lecturer's books
    const books = await prisma.book.findMany({
      where: {
        createdById: session.user.id,
      },
      include: {
        author: true,
        category: true,
        copies: true,
        ebook: true,
        _count: {
          select: {
            copies: true,
            reservations: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the response to include all fields
    const formattedBooks = books.map((book) => ({
      ...book,
      // Ensure these fields are included
      publisher: book.publisher || "",
      description: book.description || "",
      coverImage: book.coverImage ? `/api/files/${book.coverImage}` : null,
      ebook: book.ebook
        ? {
            ...book.ebook,
            filePath: `/api/files/${book.ebook.filePath}`,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      data: formattedBooks,
      pagination: {
        page: 1,
        limit: 10,
        total: books.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 },
    );
  }
}

// ========================================================
// POST: /api/books/lecturer
// ========================================================
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role ?? "";

    if (!["LECTURER", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const contentLength = Number(req.headers.get("content-length")) || 0;
    const bodyLimitError = validateContentLength(
      contentLength,
      FILE_LIMITS.cover + FILE_LIMITS.ebook + 1024 * 1024,
    );
    if (bodyLimitError) return bodyLimitError;

    const formData = await req.formData();

    const cover = formData.get("cover") as File | null;
    const ebook = formData.get("ebook") as File | null;

    const coverSizeError = validateFileSize(cover, FILE_LIMITS.cover, "Cover");
    if (coverSizeError) return coverSizeError;
    const ebookSizeError = validateFileSize(ebook, FILE_LIMITS.ebook, "Ebook");
    if (ebookSizeError) return ebookSizeError;

    const title = formData.get("title") as string;
    const isbn = formData.get("isbn") as string;
    const authorName = formData.get("author") as string;
    const categoryName = formData.get("category") as string;

    const shelfLocation = formData.get("shelfLocation") as string | null;
    const donate = formData.get("donate") as string | null;
    const semester = formData.get("semester") as string | null;

    const copies = Number(formData.get("copies") || 1);

    if (!title || !isbn || !authorName || !categoryName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const isLecturer = role === "LECTURER";

    const STORAGE_ROOT = path.resolve(
      process.cwd(),
      "..",
      "ucstgo-library-storage",
    );

    function getUploadPath(type: "covers" | "ebooks") {
      const d = new Date();
      const year = d.getFullYear().toString();
      const month = String(d.getMonth() + 1).padStart(2, "0");

      return {
        dir: join(STORAGE_ROOT, "books", type, year, month),
        dbPath: `books/${type}/${year}/${month}`,
      };
    }

    /* ---------------- COVER ---------------- */
    let coverDbPath: string | null = null;

    if (cover && cover.size > 0) {
      const p = getUploadPath("covers");
      await mkdir(p.dir, { recursive: true });

      const fileName = `${crypto.randomUUID()}-${cover.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      await writeFile(
        join(p.dir, fileName),
        Buffer.from(await cover.arrayBuffer()),
      );

      coverDbPath = `${p.dbPath}/${fileName}`;
    }

    /* ---------------- EBOOK ---------------- */
    let ebookDbPath: string | null = null;

    if (ebook && ebook.size > 0) {
      const p = getUploadPath("ebooks");
      await mkdir(p.dir, { recursive: true });

      const fileName = `${crypto.randomUUID()}-${ebook.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      await writeFile(
        join(p.dir, fileName),
        Buffer.from(await ebook.arrayBuffer()),
      );

      ebookDbPath = `${p.dbPath}/${fileName}`;
    }

    const author = await prisma.author.upsert({
      where: { name: authorName },
      update: {},
      create: { name: authorName },
    });

    const category = await prisma.category.upsert({
      where: { name: categoryName },
      update: {},
      create: { name: categoryName },
    });

    const result = await prisma.$transaction(async (tx) => {
      const newBook = await tx.book.create({
        data: {
          title,
          isbn,
          donate,
          description: (formData.get("description") as string) || null,
          publisher: (formData.get("publisher") as string) || null,
          publicationYear: formData.get("publicationYear")
            ? Number(formData.get("publicationYear"))
            : null,
          language: (formData.get("language") as string) || "English",
          coverImage: coverDbPath,
          categoryId: category.id,
          authorId: author.id,
          createdById: session.user.id,
        },
      });

      /* ✅ FIXED: Corrected mapping from relation string to scalar 'semesterId' column */
      await tx.ebook.create({
        data: {
          bookId: newBook.id,
          filePath: ebookDbPath,
          format: "PDF",
          accessType: isLecturer ? "LECTURER_ONLY" : "OPEN",
          semesterId: semester || null,
        },
      });

      const barcodeGen = (isbnStr: string, index: number) =>
        `${isbnStr}-${String(index + 1).padStart(3, "0")}`;

      await tx.bookCopy.createMany({
        data: Array.from({ length: copies }).map((_, i) => ({
          bookId: newBook.id,
          barcode: barcodeGen(isbn, i),
          status: "AVAILABLE",
          shelfLocation: shelfLocation || "Unassigned Workspace",
        })),
      });

      return newBook;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("Lecturer Post API Error:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A book with this ISBN already exists." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
