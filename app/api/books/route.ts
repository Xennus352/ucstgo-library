import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path, { join } from "path";
import {
  FILE_LIMITS,
  validateContentLength,
  validateFileSize,
} from "@/lib/upload";
import { toNextResponse } from "@/lib/errors";
import { requireRole, ALLOWED_BOOK_ROLES } from "@/lib/services/auth.service";
import { listBooks, createBook } from "@/lib/services/book.service";

function getUploadPath(type: "covers" | "ebooks") {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const baseStorageDir = path.resolve(process.cwd(), "..", "ucstgo-library-storage");
  return {
    dir: join(baseStorageDir, "books", type, year, month),
    dbPath: `books/${type}/${year}/${month}`,
  };
}

async function ensureUploadDir(type: "covers" | "ebooks") {
  const { dir } = getUploadPath(type);
  await mkdir(dir, { recursive: true });
}

function generateFileName(file: File) {
  const ext = file.name.split(".").pop() || "";
  const baseName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
  return `${crypto.randomUUID()}-${baseName}.${ext}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const result = await listBooks({
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "20", 10),
      q: searchParams.get("q") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      status: searchParams.get("status") || undefined,
      type: searchParams.get("type") || undefined,
      semester: searchParams.get("semester") || undefined,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return toNextResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(req.headers, ALLOWED_BOOK_ROLES);

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
    if (cover && cover instanceof File && cover.size > 0) {
      await ensureUploadDir("covers");
      const coverPath = getUploadPath("covers");
      const coverBuffer = Buffer.from(await cover.arrayBuffer());
      const coverFileName = generateFileName(cover);
      await writeFile(join(coverPath.dir, coverFileName), coverBuffer);
      coverDbPath = `${coverPath.dbPath}/${coverFileName}`;
    }

    let ebookDbPath: string | null = null;
    if (ebook && ebook instanceof File && ebook.size > 0) {
      await ensureUploadDir("ebooks");
      const ebookPath = getUploadPath("ebooks");
      const ebookBuffer = Buffer.from(await ebook.arrayBuffer());
      const ebookFileName = generateFileName(ebook);
      await writeFile(join(ebookPath.dir, ebookFileName), ebookBuffer);
      ebookDbPath = `${ebookPath.dbPath}/${ebookFileName}`;
    }

    const book = await createBook({
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
      createdByRole: user.role,
    });

    return NextResponse.json({ success: true, data: book }, { status: 201 });
  } catch (error: any) {
    console.error("API Error:", error);
    return toNextResponse(error);
  }
}
