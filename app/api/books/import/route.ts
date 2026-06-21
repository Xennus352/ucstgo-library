import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import unzipper from "unzipper";
import { writeFile, mkdir } from "fs/promises";
import { join, resolve } from "path";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

import {
  generateBarcode,
  getOrCreateAuthor,
  getOrCreateCategory,
} from "@/lib/upload";

import { Semester } from "@/app/generated/prisma/enums";

/* -----------------------------------
   STORAGE CONFIG (MATCHS POST API)
------------------------------------ */

const STORAGE_ROOT = resolve(process.cwd(), "..", "ucstgo-library-storage");

function getZipUploadPath(type: "covers" | "ebooks") {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return {
    dir: join(STORAGE_ROOT, "books", type, year, month),
    dbPath: `books/${type}/${year}/${month}`,
  };
}

async function ensureZipDir(type: "covers" | "ebooks") {
  const { dir } = getZipUploadPath(type);
  await mkdir(dir, { recursive: true });
}

function sanitizeFileName(name: string) {
  return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
}

/* -----------------------------------
   ZIP IMPORT API
------------------------------------ */

export async function POST(req: Request) {
  try {
    /* -----------------------------
       AUTH & ROLE VERIFICATION
    ----------------------------- */
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check (fallback to empty string avoids the TypeScript compilation error)
    const allowedRoles = ["LECTURER", "LIBRARIAN", "ADMIN"];
    if (!allowedRoles.includes(session.user.role ?? "")) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to import books." },
        { status: 403 },
      );
    }

    const formData = await req.formData();
    const zipFile = formData.get("file") as File;

    if (!zipFile) {
      return NextResponse.json({ error: "ZIP file required" }, { status: 400 });
    }

    const buffer = Buffer.from(await zipFile.arrayBuffer());

    /* -----------------------------
       Extract ZIP
    ----------------------------- */
    const directory = await unzipper.Open.buffer(buffer);

    let excelBuffer: Buffer | null = null;
    const fileMap = new Map<string, Buffer>();

    for (const file of directory.files) {
      if (file.type !== "File") continue;

      const content = await file.buffer();
      const normalizedPath = file.path.replace(/\\/g, "/").toLowerCase();

      if (normalizedPath.endsWith(".xlsx")) {
        excelBuffer = content;
      } else {
        fileMap.set(normalizedPath, content);
      }
    }

    if (!excelBuffer) {
      return NextResponse.json(
        { error: "Excel file missing in ZIP" },
        { status: 400 },
      );
    }

    /* -----------------------------
       Read Excel
    ----------------------------- */
    const workbook = XLSX.read(excelBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    /* -----------------------------
       Ensure storage directories
    ----------------------------- */
    await ensureZipDir("covers");
    await ensureZipDir("ebooks");

    let processedCount = 0;

    /* -----------------------------
       Process rows
    ----------------------------- */
    for (const row of rows as any[]) {
      const title = String(row.title || "").trim();
      const isbn = String(row.isbn || "").trim();
      const authorName = String(row.author || "").trim();
      const categoryName = String(row.category || "").trim();

      if (!title || !isbn || !authorName || !categoryName) continue;

      const coverFile = row.cover_file;
      if (!coverFile) {
        throw new Error(`Missing cover_file for book: ${title}`);
      }

      const normalize = (p: string) => p.replace(/\\/g, "/").toLowerCase();
      const coverKey = normalize(`covers/${coverFile}`);

      const coverBuffer =
        fileMap.get(coverKey) ||
        [...fileMap.entries()].find(([k]) => k.endsWith(coverKey))?.[1] ||
        null;

      if (!coverBuffer) {
        throw new Error(`Cover not found in ZIP: ${coverFile}`);
      }

      /* -----------------------------
         SAVE COVER
      ----------------------------- */
      const coverPath = getZipUploadPath("covers");
      const coverFileName = `${crypto.randomUUID()}-${sanitizeFileName(coverFile)}`;
      const coverFullPath = join(coverPath.dir, coverFileName);

      await writeFile(coverFullPath, coverBuffer);
      const coverDbPath = `${coverPath.dbPath}/${coverFileName}`;

      /* -----------------------------
         SAVE EBOOK (optional)
      ----------------------------- */
      let ebookDbPath: string | null = null;
      const ebookFile = row.ebook_file;

      if (ebookFile) {
        const ebookKey = normalize(`ebooks/${ebookFile}`);

        const ebookBuffer =
          fileMap.get(ebookKey) ||
          [...fileMap.entries()].find(([k]) => k.endsWith(ebookKey))?.[1] ||
          null;

        if (ebookBuffer) {
          const ebookPath = getZipUploadPath("ebooks");
          const ebookFileName = `${crypto.randomUUID()}-${sanitizeFileName(ebookFile)}`;
          const ebookFullPath = join(ebookPath.dir, ebookFileName);

          await writeFile(ebookFullPath, ebookBuffer);
          ebookDbPath = `${ebookPath.dbPath}/${ebookFileName}`;
        }
      }

      /* -----------------------------
         DB OPERATIONS
      ----------------------------- */
      const author = await getOrCreateAuthor(authorName);
      const category = await getOrCreateCategory(categoryName);

      const copiesCount = row.copies ? Number(row.copies) : 1;
      const semester = row.semester ? (row.semester as Semester) : null;

      await prisma.$transaction(async (tx) => {
        const book = await tx.book.create({
          data: {
            title,
            isbn,
            coverImage: coverDbPath,
            authorId: author.id,
            categoryId: category.id,
            publisher: row.publisher || null,
            description: row.description || null,
            donate: row.donate ? String(row.donate) : null,
            publicationYear: row.year ? Number(row.year) : null,
            language: row.language || "English",
            createdById: session.user.id,
          },
        });

        if (ebookDbPath) {
          await tx.ebook.create({
            data: {
              bookId: book.id,
              filePath: ebookDbPath,
              format: "PDF",
              accessType: "OPEN",
              semester,
            },
          });
        }

        await tx.bookCopy.createMany({
          data: Array.from({ length: copiesCount }).map((_, i) => ({
            bookId: book.id,
            barcode: generateBarcode(isbn, i),
            status: "AVAILABLE",
            shelfLocation: row.shelfLocation || "Unassigned",
          })),
        });
      });

      processedCount++;
    }

    return NextResponse.json({
      success: true,
      inserted: processedCount,
    });
  } catch (err: any) {
    console.error("Bulk Import Error:", err);
    return NextResponse.json(
      { error: err.message || "Import failed" },
      { status: 500 },
    );
  }
}
