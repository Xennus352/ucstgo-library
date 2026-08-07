import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, mkdir } from "fs/promises";
import path, { join } from "path";
import {
  FILE_LIMITS,
  validateContentLength,
  validateFileSize,
} from "@/lib/upload";
import { toNextResponse } from "@/lib/errors";
import {
  requireRole,
  ALLOWED_BOOK_ROLES,
} from "@/lib/services/auth.service";
import {
  getBookById,
  updateBook,
  deleteBook,
  generateBarcode,
} from "@/lib/services/book.service";
import prisma from "@/lib/prisma";

const STORAGE_ROOT = path.resolve(process.cwd(), "..", "ucstgo-library-storage");

function getUploadPath(type: "covers" | "ebooks") {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return {
    dir: join(STORAGE_ROOT, "books", type, year, month),
    dbPath: `books/${type}/${year}/${month}`,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const book = await getBookById(id);
    return NextResponse.json({ success: true, data: book });
  } catch (error) {
    return toNextResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(req.headers, ALLOWED_BOOK_ROLES);
    const { id } = await context.params;

    const contentLength = Number(req.headers.get("content-length")) || 0;
    const bodyLimitError = validateContentLength(
      contentLength,
      FILE_LIMITS.cover + FILE_LIMITS.ebook + 1024 * 1024,
    );
    if (bodyLimitError) return bodyLimitError;

    const formData = await req.formData();
    const cover = formData.get("cover") as File | null;
    const ebookFile = formData.get("ebook") as File | null;

    const coverSizeError = validateFileSize(cover, FILE_LIMITS.cover, "Cover");
    if (coverSizeError) return coverSizeError;
    const ebookSizeError = validateFileSize(ebookFile, FILE_LIMITS.ebook, "Ebook");
    if (ebookSizeError) return ebookSizeError;

    const existingBook = await prisma.book.findUnique({
      where: { id },
      include: { ebook: true },
    });
    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    let coverImage = existingBook.coverImage;
    if (cover && cover.size > 0) {
      const coverPath = getUploadPath("covers");
      await mkdir(coverPath.dir, { recursive: true });
      const fileName = `${crypto.randomUUID()}-${cover.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      await writeFile(
        join(coverPath.dir, fileName),
        Buffer.from(await cover.arrayBuffer()),
      );
      coverImage = `${coverPath.dbPath}/${fileName}`;
      if (existingBook.coverImage) {
        try {
          await unlink(path.join(STORAGE_ROOT, existingBook.coverImage));
        } catch {}
      }
    }

    let ebookDbPath: string | null = existingBook.ebook?.filePath || null;
    if (ebookFile && ebookFile.size > 0) {
      const ebookPath = getUploadPath("ebooks");
      await mkdir(ebookPath.dir, { recursive: true });
      const fileName = `${crypto.randomUUID()}-${ebookFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      await writeFile(
        join(ebookPath.dir, fileName),
        Buffer.from(await ebookFile.arrayBuffer()),
      );
      ebookDbPath = `${ebookPath.dbPath}/${fileName}`;
      if (existingBook.ebook?.filePath) {
        try {
          await unlink(path.join(STORAGE_ROOT, existingBook.ebook.filePath));
        } catch {}
      }
    }

    const updatedBook = await updateBook(
      id,
      {
        title: String(formData.get("title") || ""),
        isbn: String(formData.get("isbn") || ""),
        authorName: String(formData.get("author") || ""),
        categoryName: String(formData.get("category") || ""),
        description: String(formData.get("description") || ""),
        publisher: String(formData.get("publisher") || ""),
        language: String(formData.get("language") || ""),
        coverImage,
        ebookDbPath,
        semesterId: formData.get("semester")
          ? String(formData.get("semester"))
          : null,
        publicationYear: formData.get("publicationYear")
          ? Number(formData.get("publicationYear"))
          : null,
        donate:
          formData.get("donate") !== null
            ? String(formData.get("donate"))
            : null,
      },
      user.id,
    );

    const desiredCopies = Number(formData.get("copies") || 0);
    const shelfLocation = String(formData.get("shelfLocation") || "");
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
          barcode: generateBarcode(String(formData.get("isbn") || ""), currentCopiesCount + i),
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
          { error: "Cannot reduce copies because some are borrowed/unavailable." },
          { status: 400 },
        );
      }
      await prisma.bookCopy.deleteMany({
        where: { id: { in: copiesToDelete.map((c: any) => c.id) } },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedBook,
        coverImage: updatedBook.coverImage
          ? `/api/files/${updatedBook.coverImage}`
          : null,
        ebook: updatedBook.ebook
          ? { ...updatedBook.ebook, filePath: `/api/files/${updatedBook.ebook.filePath}` }
          : null,
      },
    });
  } catch (error) {
    console.error("PATCH Error:", error);
    return toNextResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const files = await deleteBook(id);

    if (files.coverImage) {
      try {
        await unlink(path.join(STORAGE_ROOT, files.coverImage));
      } catch {}
    }
    if (files.ebookPath) {
      try {
        await unlink(path.join(STORAGE_ROOT, files.ebookPath));
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("DELETE Error:", error);
    return toNextResponse(error);
  }
}
