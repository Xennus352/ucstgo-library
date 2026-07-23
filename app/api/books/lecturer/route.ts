import { NextRequest, NextResponse } from "next/server";
import path, { join } from "path";
import { mkdir, writeFile } from "fs/promises";
import crypto from "crypto";
import {
  FILE_LIMITS,
  validateContentLength,
  validateFileSize,
} from "@/lib/upload";
import { toNextResponse } from "@/lib/errors";
import { requireSession } from "@/lib/services/auth.service";
import { getLecturerBooks, createBook } from "@/lib/services/book.service";

const STORAGE_ROOT = path.resolve(process.cwd(), "..", "ucstgo-library-storage");

function getUploadPath(type: "covers" | "ebooks") {
  const d = new Date();
  const year = d.getFullYear().toString();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return {
    dir: join(STORAGE_ROOT, "books", type, year, month),
    dbPath: `books/${type}/${year}/${month}`,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const books = await getLecturerBooks(user.id);
    return NextResponse.json({
      success: true,
      data: books,
      pagination: { page: 1, limit: 10, total: books.length, totalPages: 1 },
    });
  } catch (error) {
    return toNextResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await requireSession(req.headers);
    const role = user.role;
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

    if (!title || !isbn || !formData.get("author") || !formData.get("category")) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    let coverDbPath: string | null = null;
    if (cover && cover.size > 0) {
      const p = getUploadPath("covers");
      await mkdir(p.dir, { recursive: true });
      const fileName = `${crypto.randomUUID()}-${cover.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      await writeFile(join(p.dir, fileName), Buffer.from(await cover.arrayBuffer()));
      coverDbPath = `${p.dbPath}/${fileName}`;
    }

    let ebookDbPath: string | null = null;
    if (ebook && ebook.size > 0) {
      const p = getUploadPath("ebooks");
      await mkdir(p.dir, { recursive: true });
      const fileName = `${crypto.randomUUID()}-${ebook.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      await writeFile(join(p.dir, fileName), Buffer.from(await ebook.arrayBuffer()));
      ebookDbPath = `${p.dbPath}/${fileName}`;
    }

    const result = await createBook({
      title,
      isbn,
      authorName: formData.get("author") as string,
      categoryName: formData.get("category") as string,
      coverDbPath,
      ebookDbPath,
      semesterId: formData.get("semester") as string | null,
      description: (formData.get("description") as string) || null,
      publisher: (formData.get("publisher") as string) || null,
      publicationYear: formData.get("publicationYear")
        ? Number(formData.get("publicationYear"))
        : null,
      language: (formData.get("language") as string) || "English",
      donate: formData.get("donate") as string | null,
      copies: Number(formData.get("copies") || 1),
      shelfLocation: formData.get("shelfLocation") as string | null,
      createdById: user.id,
      createdByRole: role,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error("Lecturer Post API Error:", error);
    return toNextResponse(error);
  }
}
