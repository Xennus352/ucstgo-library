import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import prisma from "@/lib/prisma";

import {
  ensureUploadDir,
  generateBarcode,
  getOrCreateAuthor,
  getOrCreateCategory,
  getUploadPath,
} from "@/lib/upload";
import { Semester } from "@/app/generated/prisma/enums";

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
            semester: true, // Added back to individual fetch payload
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

    // availability calculation
    const stats = {
      AVAILABLE: 0,
      BORROWED: 0,
      LOST: 0,
      DAMAGED: 0,
    };

    for (const copy of book.copies) {
      stats[copy.status] = (stats[copy.status] || 0) + 1;
    }

    const available = stats.AVAILABLE;
    const borrowed = stats.BORROWED;
    const total = book._count.copies;

    const enrichedBook = {
      ...book,
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

    // 1. SAFE extraction
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
    const ebookFile = formData.get("ebook") as File | null; // Extracted ebook file element if uploaded

    // 2. Relations
    const [author, category] = await Promise.all([
      getOrCreateAuthor(authorName),
      getOrCreateCategory(categoryName),
    ]);

    // 3. Existing book check
    const existingBook = await prisma.book.findUnique({
      where: { id },
      include: { ebook: true },
    });

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // 4. Cover upload
    let coverImage = existingBook.coverImage;

    if (cover && cover.size > 0) {
      await ensureUploadDir("covers");
      const upload = getUploadPath("covers");

      const buffer = Buffer.from(await cover.arrayBuffer());
      const fileName = `${Date.now()}-${cover.name.replace(/\s+/g, "-")}`;

      await writeFile(join(upload.dir, fileName), buffer);
      coverImage = `${upload.publicPath}/${fileName}`;

      if (existingBook.coverImage) {
        try {
          await unlink(join(process.cwd(), "public", existingBook.coverImage));
        } catch {}
      }
    }

    // 5. E-book Upload & Database Record Mutation
    let ebookDbPath: string | null = existingBook.ebook?.filePath || null;

    if (ebookFile && ebookFile.size > 0) {
      await ensureUploadDir("ebooks");
      const ebookUpload = getUploadPath("ebooks");

      const ebookBuffer = Buffer.from(await ebookFile.arrayBuffer());
      const ebookFileName = `${Date.now()}-${ebookFile.name.replace(/\s+/g, "-")}`;

      await writeFile(join(ebookUpload.dir, ebookFileName), ebookBuffer);
      ebookDbPath = `${ebookUpload.publicPath}/${ebookFileName}`;

      // Delete former physical book PDF file if replacing it
      if (existingBook.ebook?.filePath) {
        try {
          await unlink(
            join(process.cwd(), "public", existingBook.ebook.filePath),
          );
        } catch {}
      }
    }

    // 6. Update BOOK + Upsert/Update Connected E-book Sub-relation data
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

        // Dynamic nested relation write to sync E-book adjustments seamlessly
        ebook: ebookDbPath
          ? {
              upsert: {
                create: { filePath: ebookDbPath, format: "PDF", semester },
                update: { filePath: ebookDbPath, semester },
              },
            }
          : semester // If no new file was uploaded, but the target curriculum semester changed
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

    // 7. Sync BookCopy table
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

    // Add copies
    if (diff > 0) {
      const newCopies = Array.from({ length: diff }).map((_, index) => ({
        bookId: id,
        barcode: generateBarcode(isbn, currentCopiesCount + index),
        status: "AVAILABLE" as const,
        shelfLocation: shelfLocation || "Unassigned",
      }));

      await prisma.bookCopy.createMany({ data: newCopies });
    }

    // Remove copies
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
              "Cannot reduce copies because some copies are borrowed or unavailable.",
          },
          { status: 400 },
        );
      }

      await prisma.bookCopy.deleteMany({
        where: { id: { in: copiesToDelete.map((copy) => copy.id) } },
      });
    }

    return NextResponse.json({ success: true, data: updatedBook });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 },
    );
  }
}
