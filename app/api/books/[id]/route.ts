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
        {
          success: false,
          error: "Book not found",
        },
        { status: 404 },
      );
    }

    // -----------------------------
    // availability calculation (same logic style as list API)
    // -----------------------------
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
      {
        success: true,
        data: enrichedBook,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch book",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const formData = await req.formData();

    // -----------------------------
    // 1. SAFE extraction
    // -----------------------------
    const title = String(formData.get("title") || "");
    const isbn = String(formData.get("isbn") || "");
    const authorName = String(formData.get("author") || "");
    const categoryName = String(formData.get("category") || "");
    const description = String(formData.get("description") || "");
    const publisher = String(formData.get("publisher") || "");
    const language = String(formData.get("language") || "");

    const shelfLocation = String(formData.get("shelfLocation") || "");

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

    // -----------------------------
    // 2. Relations
    // -----------------------------
    const [author, category] = await Promise.all([
      getOrCreateAuthor(authorName),
      getOrCreateCategory(categoryName),
    ]);

    // -----------------------------
    // 3. Existing book check
    // -----------------------------
    const existingBook = await prisma.book.findUnique({
      where: { id },
    });

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // -----------------------------
    // 4. Cover upload
    // -----------------------------
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

    // -----------------------------
    // 5. Update BOOK
    // -----------------------------
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
      },
      include: {
        author: true,
        category: true,
      },
    });

    // -----------------------------
    // 6. Sync BookCopy table
    // -----------------------------

    const currentCopiesCount = await prisma.bookCopy.count({
      where: {
        bookId: id,
      },
    });

    const diff = desiredCopies - currentCopiesCount;

    // Update shelf location for all copies
    if (shelfLocation) {
      await prisma.bookCopy.updateMany({
        where: {
          bookId: id,
        },
        data: {
          shelfLocation,
        },
      });
    }

    // -----------------------------
    // Add copies
    // -----------------------------
    if (diff > 0) {
      const newCopies = Array.from({ length: diff }).map((_, index) => ({
        bookId: id,
        barcode: generateBarcode(isbn, currentCopiesCount + index + 1),
        status: "AVAILABLE" as const,
        shelfLocation: shelfLocation || "Unassigned",
      }));

      await prisma.bookCopy.createMany({
        data: newCopies,
      });
    }

    // -----------------------------
    // Remove copies
    // -----------------------------
    if (diff < 0) {
      const copiesToDelete = await prisma.bookCopy.findMany({
        where: {
          bookId: id,
          status: "AVAILABLE",
        },
        orderBy: {
          createdAt: "desc",
        },
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
        where: {
          id: {
            in: copiesToDelete.map((copy) => copy.id),
          },
        },
      });
    }

    // -----------------------------
    // 8. Response
    // -----------------------------
    return NextResponse.json({
      success: true,
      data: updatedBook,
    });
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 },
    );
  }
}
