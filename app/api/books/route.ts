import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path, { join } from "path";
import prisma from "@/lib/prisma";
import { Semester } from "@/app/generated/prisma/enums";

/* -----------------------------
   Upload Helpers (Decoupled Sandbox Model)
----------------------------- */

function getUploadPath(type: "covers" | "ebooks") {
  const date = new Date();

  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  // Dynamically step out of './ucstgo-library' into the adjacent storage sandbox
  const baseStorageDir = path.resolve(
    process.cwd(),
    "..",
    "ucstgo-library-storage",
  );

  return {
    // Physical storage sandbox absolute path
    dir: join(baseStorageDir, "books", type, year, month),

    // Normalized clean path stored in the database
    dbPath: `books/${type}/${year}/${month}`,
  };
}

async function ensureUploadDir(type: "covers" | "ebooks") {
  const { dir } = getUploadPath(type);

  await mkdir(dir, {
    recursive: true,
  });
}

function generateFileName(file: File) {
  const ext = file.name.split(".").pop() || "";

  const baseName = file.name
    .replace(/\.[^/.]+$/, "") // remove extension
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // special chars -> -
    .replace(/^-+|-+$/g, "") // trim -
    .replace(/-+/g, "-"); // remove duplicate -

  return `${crypto.randomUUID()}-${baseName}.${ext}`;
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
  const cleanIsbn = isbn.replace(/-/g, "");
  return `${cleanIsbn}-${String(index + 1).padStart(4, "0")}`;
}

/* -----------------------------
   GET books
----------------------------- */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // 1. Pagination
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10),
      100,
    );
    const skip = (page - 1) * limit;

    // 2. Search & Filter Parameters
    const searchQuery = searchParams.get("q") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const status = searchParams.get("status") || "";
    const type = searchParams.get("type") || "all";
    const semesterFilter = searchParams.get("semester") || "";

    // 3. Build WHERE clause
    const where: any = {};

    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { isbn: { contains: searchQuery, mode: "insensitive" } },
        {
          author: {
            name: { contains: searchQuery, mode: "insensitive" },
          },
        },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      if (status === "available") {
        where.copies = { some: { status: "AVAILABLE" } };
      } else if (status === "borrowed") {
        where.copies = {
          every: { status: "BORROWED" },
          some: { status: "BORROWED" },
        };
      } else if (status === "reserved") {
        where.reservations = { some: { status: "ACTIVE" } };
      }
    }

    if (type === "ebook") {
      where.ebook = {
        isNot: null,
        ...(semesterFilter && { semester: semesterFilter as Semester }),
      };
    } else if (type === "physical") {
      where.ebook = null;
      if (!where.copies) {
        where.copies = { some: {} };
      }
    }

    // 4. Fetch books + total count with filters
    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        select: {
          id: true,
          isbn: true,
          title: true,
          coverImage: true,
          language: true,
          publicationYear: true,
          donate: true,
          createdAt: true,

          author: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } },
          copies: {
            select: {
              id: true,
              barcode: true,
              shelfLocation: true,
              status: true,
            },
          },

          ebook: {
            select: {
              id: true,
              format: true,
              filePath: true,
              semester: true,
            },
          },

          _count: { select: { copies: true, reservations: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.book.count({ where }),
    ]);

    // 5. Fetch BookCopy status stats for filtered books
    const bookIds = books.map((book) => book.id);

    const copyStats = await prisma.bookCopy.groupBy({
      by: ["bookId", "status"],
      where: { bookId: { in: bookIds } },
      _count: { status: true },
    });

    // 6. Build availability map
    const availabilityMap = new Map<string, any>();

    for (const item of copyStats) {
      if (!availabilityMap.has(item.bookId)) {
        availabilityMap.set(item.bookId, {
          AVAILABLE: 0,
          BORROWED: 0,
          LOST: 0,
          DAMAGED: 0,
        });
      }
      availabilityMap.get(item.bookId)[item.status] = item._count.status;
    }

    // 7. Attach availability AND inject security route file prefixes
    const enrichedBooks = books.map((book) => {
      const stats = availabilityMap.get(book.id) || {
        AVAILABLE: 0,
        BORROWED: 0,
        LOST: 0,
        DAMAGED: 0,
      };

      const available = stats.AVAILABLE;
      const borrowed = stats.BORROWED;
      const total = book._count.copies;

      return {
        ...book,
        coverImage: book.coverImage ? `/api/files/${book.coverImage}` : null,
        ebook: book.ebook
          ? {
              ...book.ebook,
              filePath: `/api/files/${book.ebook.filePath}`,
            }
          : null,
        status:
          available > 0
            ? "available"
            : borrowed > 0
              ? "borrowed"
              : "unavailable",
        availability: {
          available,
          borrowed,
          total,
          isAvailable: available > 0,
        },
      };
    });

    // 8. Response
    return NextResponse.json(
      {
        success: true,
        data: enrichedBooks,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch books" },
      { status: 500 },
    );
  }
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
    const donate = formData.get("donate") as string | null;
    const semester = formData.get("semester") as string | null;

    // Softly cast as optional parameters
    const cover = formData.get("cover") as File | null;
    const ebook = formData.get("ebook") as File | null;

    const copies = Number(formData.get("copies") || 1);

    if (!title || !isbn || !authorName || !categoryName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    /* -----------------------------
       Save Cover (Safe Optional Processing)
    ----------------------------- */
    let coverDbPath: string | null = null;

    if (cover && cover instanceof File && cover.size > 0) {
      await ensureUploadDir("covers");
      const coverPath = getUploadPath("covers");
      const coverBuffer = Buffer.from(await cover.arrayBuffer());

      const coverFileName = generateFileName(cover);
      const coverFullPath = join(coverPath.dir, coverFileName);

      await writeFile(coverFullPath, coverBuffer);
      coverDbPath = `${coverPath.dbPath}/${coverFileName}`;
    }

    /* -----------------------------
       Save Ebook (Safe Optional Processing)
    ----------------------------- */
    let ebookDbPath: string | null = null;

    if (ebook && ebook instanceof File && ebook.size > 0) {
      await ensureUploadDir("ebooks");
      const ebookPath = getUploadPath("ebooks");
      const ebookBuffer = Buffer.from(await ebook.arrayBuffer());

      const ebookFileName = generateFileName(ebook);
      const ebookFullPath = join(ebookPath.dir, ebookFileName);

      await writeFile(ebookFullPath, ebookBuffer);
      ebookDbPath = `${ebookPath.dbPath}/${ebookFileName}`;
    }

    /* -----------------------------
       DATABASE SAFE OPERATIONS
    ----------------------------- */
    const author = await getOrCreateAuthor(authorName);
    const category = await getOrCreateCategory(categoryName);

    const book = await prisma.book.create({
      data: {
        title,
        isbn,
        donate: donate || null,
        description: (formData.get("description") as string) || null,
        publisher: (formData.get("publisher") as string) || null,
        publicationYear: formData.get("publicationYear")
          ? Number(formData.get("publicationYear"))
          : null,
        language: (formData.get("language") as string) || "English",
        coverImage: coverDbPath, // Implicitly accepts string paths or null
        categoryId: category.id,
        authorId: author.id,
      },
    });

    if (ebookDbPath) {
      await prisma.ebook.create({
        data: {
          bookId: book.id,
          filePath: ebookDbPath,
          format: "PDF",
          accessType: "OPEN",
          semester: semester ? (semester as Semester) : null,
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
