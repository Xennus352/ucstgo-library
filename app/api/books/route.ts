import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import prisma from "@/lib/prisma";

/* -----------------------------
   Upload Helpers
----------------------------- */

function getUploadPath(type: "covers" | "ebooks") {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return {
    dir: join(process.cwd(), `public/uploads/books/${type}/${year}/${month}`),
    publicPath: `/uploads/books/${type}/${year}/${month}`,
  };
}

async function ensureUploadDir(type: "covers" | "ebooks") {
  const { dir } = getUploadPath(type);
  await mkdir(dir, { recursive: true });
}

/* -----------------------------
   Helpers: safe create/find
----------------------------- */

async function getOrCreateAuthor(name: string) {
  const clean = name.trim();

  let author = await prisma.author.findFirst({
    where: {
      name: {
        equals: clean,
        mode: "insensitive",
      },
    },
  });

  if (!author) {
    author = await prisma.author.create({
      data: { name: clean },
    });
  }

  return author;
}

async function getOrCreateCategory(name: string) {
  const clean = name.trim();

  let category = await prisma.category.findFirst({
    where: {
      name: {
        equals: clean,
        mode: "insensitive",
      },
    },
  });

  if (!category) {
    category = await prisma.category.create({
      data: { name: clean },
    });
  }

  return category;
}

/* -----------------------------
   Helper: generate barcode
----------------------------- */

function generateBarcode(isbn: string, index: number): string {
  // Clean ISBN (remove hyphens)
  const cleanIsbn = isbn.replace(/-/g, "");
  // Generate barcode: ISBN-COPYYYY
  return `${cleanIsbn}-${String(index + 1).padStart(4, "0")}`;
}

/* -----------------------------
   POST /api/books
----------------------------- */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const isbn = formData.get("isbn") as string;
    const authorName = formData.get("author") as string;
    const categoryName = formData.get("category") as string;
    const shelfLocation = formData.get("shelfLocation") as string | null;

    const cover = formData.get("cover") as File;
    const ebook = formData.get("ebook") as File | null;

    const copies = Number(formData.get("copies") || 1);

    if (!title || !isbn || !authorName || !categoryName || !cover) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    /* -----------------------------
       Upload dirs
    ----------------------------- */
    await ensureUploadDir("covers");
    if (ebook) await ensureUploadDir("ebooks");

    /* -----------------------------
       Save Cover
    ----------------------------- */

    const coverPath = getUploadPath("covers");
    const coverBuffer = Buffer.from(await cover.arrayBuffer());

    const coverFileName = `${Date.now()}-${cover.name.replace(/\s+/g, "-")}`;
    const coverFullPath = join(coverPath.dir, coverFileName);

    await writeFile(coverFullPath, coverBuffer);

    const coverDbPath = `${coverPath.publicPath}/${coverFileName}`;

    /* -----------------------------
       Save Ebook
    ----------------------------- */

    let ebookDbPath: string | null = null;

    if (ebook) {
      const ebookPath = getUploadPath("ebooks");
      const ebookBuffer = Buffer.from(await ebook.arrayBuffer());

      const ebookFileName = `${Date.now()}-${ebook.name.replace(/\s+/g, "-")}`;
      const ebookFullPath = join(ebookPath.dir, ebookFileName);

      await writeFile(ebookFullPath, ebookBuffer);

      ebookDbPath = `${ebookPath.publicPath}/${ebookFileName}`;
    }

    /* -----------------------------
       DATABASE SAFE OPS
    ----------------------------- */

    const author = await getOrCreateAuthor(authorName);
    const category = await getOrCreateCategory(categoryName);

    const book = await prisma.book.create({
      data: {
        title,
        isbn,

        description: (formData.get("description") as string) || null,
        publisher: (formData.get("publisher") as string) || null,
        publicationYear: formData.get("publicationYear")
          ? Number(formData.get("publicationYear"))
          : null,
        language: (formData.get("language") as string) || "English",

        coverImage: coverDbPath,

        categoryId: category.id,
        authorId: author.id,
      },
    });

    if (ebookDbPath) {
      await prisma.ebook.create({
        data: {
          bookId: book.id,
          filePath: ebookDbPath,
          format: "PDF", // Default format
          accessType: "OPEN", // Default access type
        },
      });
    }

    // Create book copies with shelf location if provided
    await prisma.bookCopy.createMany({
      data: Array.from({ length: copies }).map((_, i) => ({
        bookId: book.id,
        barcode: generateBarcode(isbn, i),
        status: "AVAILABLE",
        shelfLocation: shelfLocation || null,
      })),
    });

    return NextResponse.json({ success: true, data: book }, { status: 201 });
  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 },
    );
  }
}
