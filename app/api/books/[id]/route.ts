import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path, { join } from "path";
import prisma from "@/lib/prisma";

import {
  ensureUploadDir,
  generateBarcode,
  getOrCreateAuthor,
  getOrCreateCategory,
  getUploadPath,
} from "@/lib/upload";
import { Semester } from "@/app/generated/prisma/enums";

// Helper to determine absolute file resolution path inside decoupled sandbox
// function getAbsoluteStoragePath(dbRelativePath: string): string {
//   const baseStorageDir = path.resolve(
//     process.cwd(),
//     "..",
//     "ucstgo-library-storage",
//   );
//   return join(baseStorageDir, dbRelativePath);
// }

/* -----------------------------
   GET /api/books/[id]
----------------------------- */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        author: true,
        category: true,
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
        _count: {
          select: {
            copies: true,
            reservations: true,
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 },
      );
    }

    // Availability calculation
    const stats: Record<string, number> = {
      AVAILABLE: 0,
      BORROWED: 0,
      LOST: 0,
      DAMAGED: 0,
    };

    for (const copy of book.copies) {
      const statusKey = copy.status as string;
      stats[statusKey] = (stats[statusKey] || 0) + 1;
    }

    const available = stats.AVAILABLE;
    const borrowed = stats.BORROWED;
    const total = book._count.copies;

    // TRANSFORM ASSET LINKS: Format database keys for frontend route usage
    const enrichedBook = {
      ...book,
      coverImage: book.coverImage ? `/api/files/${book.coverImage}` : null,
      ebook: book.ebook
        ? {
            ...book.ebook,
            filePath: `/api/files/${book.ebook.filePath}`,
          }
        : null,
      status:
        available > 0 ? "available" : borrowed > 0 ? "borrowed" : "unavailable",
      availability: {
        available,
        borrowed,
        total,
        isAvailable: available > 0,
      },
    };

    return NextResponse.json(
      { success: true, data: enrichedBook },
      { status: 200 },
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch book" },
      { status: 500 },
    );
  }
}

// ===============================
// STORAGE ROOT (ONLY SOURCE OF TRUTH)
// ===============================
const STORAGE_ROOT = path.resolve(
  process.cwd(),
  "..",
  "ucstgo-library-storage",
);

// Convert DB path -> absolute filesystem path
function toAbsoluteStoragePath(dbPath: string) {
  return path.join(STORAGE_ROOT, dbPath);
}

/* -----------------------------
   PATCH /api/books/[id]
----------------------------- */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const formData = await req.formData();

    const title = String(formData.get("title") || "");
    const isbn = String(formData.get("isbn") || "");
    const authorName = String(formData.get("author") || "");
    const categoryName = String(formData.get("category") || "");
    const description = String(formData.get("description") || "");
    const publisher = String(formData.get("publisher") || "");
    const language = String(formData.get("language") || "");
    const shelfLocation = String(formData.get("shelfLocation") || "");

    const donate =
      formData.get("donate") !== null ? String(formData.get("donate")) : null;

    const semester = formData.get("semester")
      ? (formData.get("semester") as Semester)
      : null;

    const publicationYearRaw = formData.get("publicationYear");
    const publicationYear =
      publicationYearRaw && !isNaN(Number(publicationYearRaw))
        ? Number(publicationYearRaw)
        : null;

    const desiredCopiesRaw = formData.get("copies");
    const desiredCopies =
      desiredCopiesRaw && !isNaN(Number(desiredCopiesRaw))
        ? Number(desiredCopiesRaw)
        : 0;

    const cover = formData.get("cover") as File | null;
    const ebookFile = formData.get("ebook") as File | null;

    const STORAGE_ROOT = path.resolve(
      process.cwd(),
      "..",
      "ucstgo-library-storage",
    );

    function getUploadPath(type: "covers" | "ebooks") {
      const date = new Date();
      const year = date.getFullYear().toString();
      const month = String(date.getMonth() + 1).padStart(2, "0");

      return {
        dir: join(STORAGE_ROOT, "books", type, year, month),
        dbPath: `books/${type}/${year}/${month}`,
      };
    }

    const [author, category] = await Promise.all([
      getOrCreateAuthor(authorName),
      getOrCreateCategory(categoryName),
    ]);

    const existingBook = await prisma.book.findUnique({
      where: { id },
      include: { ebook: true },
    });

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    /* =========================
       COVER UPDATE (FIXED)
    ========================== */
    let coverImage = existingBook.coverImage;

    if (cover && cover.size > 0) {
      const coverPath = getUploadPath("covers");

      await mkdir(coverPath.dir, { recursive: true });

      const safeName = cover.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileName = `${crypto.randomUUID()}-${safeName}`;

      const absolutePath = join(coverPath.dir, fileName);

      const buffer = Buffer.from(await cover.arrayBuffer());
      await writeFile(absolutePath, buffer);

      coverImage = `${coverPath.dbPath}/${fileName}`;

      // delete old cover
      if (existingBook.coverImage) {
        try {
          await unlink(path.join(STORAGE_ROOT, existingBook.coverImage));
        } catch {}
      }
    }

    /* =========================
       EBOOK UPDATE (FIXED)
    ========================== */
    let ebookDbPath: string | null = existingBook.ebook?.filePath || null;

    if (ebookFile && ebookFile.size > 0) {
      const ebookPath = getUploadPath("ebooks");

      await mkdir(ebookPath.dir, { recursive: true });

      const safeName = ebookFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const fileName = `${crypto.randomUUID()}-${safeName}`;

      const absolutePath = join(ebookPath.dir, fileName);

      const buffer = Buffer.from(await ebookFile.arrayBuffer());
      await writeFile(absolutePath, buffer);

      ebookDbPath = `${ebookPath.dbPath}/${fileName}`;

      // delete old ebook
      if (existingBook.ebook?.filePath) {
        try {
          await unlink(path.join(STORAGE_ROOT, existingBook.ebook.filePath));
        } catch {}
      }
    }

    /* =========================
       UPDATE DATABASE
    ========================== */
    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        title,
        isbn,
        authorId: author.id,
        categoryId: category.id,
        description,
        publisher,
        publicationYear,
        language,
        coverImage,
        donate,

        ebook: ebookDbPath
          ? {
              upsert: {
                create: {
                  filePath: ebookDbPath,
                  format: "PDF",
                  semester,
                },
                update: {
                  filePath: ebookDbPath,
                  semester,
                },
              },
            }
          : semester
            ? {
                update: { semester },
              }
            : undefined,
      },
      include: {
        author: true,
        category: true,
        ebook: true,
      },
    });

    /* =========================
       SYNC COPIES
    ========================== */
    const currentCopiesCount = await prisma.bookCopy.count({
      where: { bookId: id },
    });

    const diff = desiredCopies - currentCopiesCount;

    if (shelfLocation) {
      await prisma.bookCopy.updateMany({
        where: { bookId: id },
        data: { shelfLocation },
      });
    }

    if (diff > 0) {
      await prisma.bookCopy.createMany({
        data: Array.from({ length: diff }).map((_, i) => ({
          bookId: id,
          barcode: generateBarcode(isbn, currentCopiesCount + i),
          status: "AVAILABLE",
          shelfLocation: shelfLocation || "Unassigned",
        })),
      });
    }

    if (diff < 0) {
      const copiesToDelete = await prisma.bookCopy.findMany({
        where: { bookId: id, status: "AVAILABLE" },
        orderBy: { createdAt: "desc" },
        take: Math.abs(diff),
      });

      if (copiesToDelete.length < Math.abs(diff)) {
        return NextResponse.json(
          {
            error:
              "Cannot reduce copies because some are borrowed/unavailable.",
          },
          { status: 400 },
        );
      }

      await prisma.bookCopy.deleteMany({
        where: {
          id: { in: copiesToDelete.map((c) => c.id) },
        },
      });
    }

    /* =========================
       RESPONSE
    ========================== */
    return NextResponse.json({
      success: true,
      data: {
        ...updatedBook,
        coverImage: updatedBook.coverImage
          ? `/api/files/${updatedBook.coverImage}`
          : null,
        ebook: updatedBook.ebook
          ? {
              ...updatedBook.ebook,
              filePath: `/api/files/${updatedBook.ebook.filePath}`,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 },
    );
  }
}

/* -----------------------------
   DELETE /api/books/[id]
----------------------------- */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    // 1. Fetch record to track down existing storage assets before deletion
    const book = await prisma.book.findUnique({
      where: { id },
      include: { ebook: true },
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 },
      );
    }

    // 2. Clear out filesystem assets
    if (book.coverImage) {
      try {
        await unlink(toAbsoluteStoragePath(book.coverImage));
      } catch (err) {
        console.warn("Failed to remove cover image on deletion:", err);
      }
    }

    if (book.ebook?.filePath) {
      try {
        await unlink(toAbsoluteStoragePath(book.ebook.filePath));
      } catch (err) {
        console.warn("Failed to remove ebook file on deletion:", err);
      }
    }

    // 3. Remove database references (Cascade hooks or manual deletion blocks)
    // Delete copies and e-books first if they don't use PostgreSQL Cascades
    await prisma.$transaction([
      prisma.bookCopy.deleteMany({ where: { bookId: id } }),
      prisma.ebook.deleteMany({ where: { bookId: id } }),
      prisma.book.delete({ where: { id } }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete book record" },
      { status: 500 },
    );
  }
}
