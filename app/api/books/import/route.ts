import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import unzipper from "unzipper";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join, resolve } from "path";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

import {
  FILE_LIMITS,
  validateContentLength,
  validateFileSize,
  generateBarcode,
  getOrCreateAuthor,
  getOrCreateCategory,
} from "@/lib/upload";

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

// Normalize Excel header names ("Book Title" / "book title" / "book_title" -> "title")
function normalizeHeader(header: string) {
  const clean = String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const aliases: Record<string, string> = {
    booktitle: "title",
    titleofbook: "title",
    titleofthebook: "title",
    bookname: "title",
    book: "title",
    authorname: "author",
    authors: "author",
    writer: "author",
    authorofbook: "author",
    isbnnumber: "isbn",
    bookisbn: "isbn",
    coverfile: "cover_file",
    coverimage: "cover_file",
    bookcover: "cover_file",
    cover: "cover_file",
    image: "cover_file",
    ebookfile: "ebook_file",
    ebook: "ebook_file",
    ebooks: "ebook_file",
    ebookpath: "ebook_file",
    pdffile: "ebook_file",
    noofcopies: "copies",
    numberofcopies: "copies",
    totalcopies: "copies",
    quantity: "copies",
    categoryname: "category",
    bookcategory: "category",
    genre: "category",
    section: "category",
    shelflocation: "shelfLocation",
    shelf: "shelfLocation",
    publicationyear: "year",
    pubyear: "year",
    publishyear: "year",
    academicperiod: "semester",
    semestername: "semester",
  };
  return aliases[clean] ?? clean;
}

// Find the row that actually contains the column headers. Excel files often
// have a title/description row above the header row, which would otherwise
// make every data row look like it's missing required columns.
function findHeaderRow(
  sheet: XLSX.WorkSheet,
): { headerIndex: number; headerMap: Map<string, string>; score: number } {
  const raw = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];
  for (let i = 0; i < Math.min(raw.length, 30); i++) {
    const cells = raw[i].map((c) => String(c ?? "").trim());
    const normalized = cells.map(normalizeHeader);
    const unique = new Set(normalized);
    if (unique.has("title") && (unique.has("isbn") || unique.has("author"))) {
      const headerMap = new Map<string, string>();
      cells.forEach((cell, j) => {
        if (cell) headerMap.set(cell, normalized[j]);
      });
      const titleCol = normalized.indexOf("title");
      let score = 0;
      for (let j = i + 1; j < raw.length; j++) {
        const row = raw[j] ?? [];
        if (String(row[titleCol] ?? "").trim()) score++;
      }
      return { headerIndex: i, headerMap, score };
    }
  }
  return { headerIndex: 0, headerMap: new Map(), score: -1 };
}

function generateIsbn(): string {
  return `GEN-${crypto.randomUUID().slice(0, 10).toUpperCase()}`;
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

    const contentLength = Number(req.headers.get("content-length")) || 0;
    const bodyLimitError = validateContentLength(
      contentLength,
      FILE_LIMITS.zipImport,
    );
    if (bodyLimitError) return bodyLimitError;

    const formData = await req.formData();
    const zipFile = formData.get("file") as File;

    if (!zipFile) {
      return NextResponse.json({ error: "ZIP file required" }, { status: 400 });
    }

    const zipSizeError = validateFileSize(
      zipFile,
      FILE_LIMITS.zipImport,
      "ZIP import",
    );
    if (zipSizeError) return zipSizeError;

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

    // Pick the sheet that actually contains book data: scan every sheet and
    // choose the one whose header row is followed by the most filled-in data
    // rows. This skips instruction/cover sheets (like "1. Required Fields").
    let sheet: XLSX.WorkSheet | undefined;
    let headerIndex = 0;
    let headerMap: Map<string, string> = new Map();
    let bestScore = -1;
    for (const name of workbook.SheetNames) {
      const candidate = workbook.Sheets[name];
      const found = findHeaderRow(candidate);
      if (found.score > bestScore) {
        bestScore = found.score;
        sheet = candidate;
        headerIndex = found.headerIndex;
        headerMap = found.headerMap;
      }
    }
    if (!sheet) sheet = workbook.Sheets[workbook.SheetNames[0]];
    const allRows = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: "",
    }) as unknown[][];

    // Skip any title/description rows above the header row, then remap each
    // data row to normalized column names so "Book Title"/"Author Name"
    // style headers work too.
    const rawRows = allRows.slice(headerIndex + 1);
    const rows: Record<string, unknown>[] = rawRows.map((r) => {
      const out: Record<string, unknown> = {};
      r.forEach((value, i) => {
        const key = headerMap.get(
          String(allRows[headerIndex][i] ?? "").trim(),
        );
        if (key) out[key] = value;
      });
      return out;
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty or has no data rows" },
        { status: 400 },
      );
    }

    // Cache semesters so we only query once (map slug or id -> actual id)
    const semesters = await prisma.semester.findMany({
      select: { id: true, name: true, slug: true },
    });
    const semesterByKey = new Map<string, string>();
    for (const s of semesters) {
      semesterByKey.set(s.id.toLowerCase(), s.id);
      if (s.slug) semesterByKey.set(s.slug.toLowerCase(), s.id);
      if (s.name) semesterByKey.set(s.name.toLowerCase(), s.id);
    }

    /* -----------------------------
       Ensure storage directories
    ----------------------------- */
    await ensureZipDir("covers");
    await ensureZipDir("ebooks");

    let processedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];
    const usedIsbns = new Set<string>();

    // Cache author/category ids so we don't query the pooler per row.
    const authorIdCache = new Map<string, string>();
    const categoryIdCache = new Map<string, string>();
    const getAuthorId = async (name: string) => {
      let id = authorIdCache.get(name);
      if (!id) {
        const author = await getOrCreateAuthor(name);
        id = author.id;
        authorIdCache.set(name, id!);
      }
      return id;
    };
    const getCategoryId = async (name: string) => {
      let id = categoryIdCache.get(name);
      if (!id) {
        const category = await getOrCreateCategory(name);
        id = category.id;
        categoryIdCache.set(name, id!);
      }
      return id;
    };

    /* -----------------------------
       Process rows
    ----------------------------- */
    const processRow = async (row: Record<string, unknown>, rowNumber: number) => {
      const title = String(row.title || "").trim();
      let isbn = String(row.isbn || "").trim();
      const authorName = String(row.author || "").trim();
      const categoryName = String(row.category || "").trim();

      if (!title || !authorName || !categoryName) {
        skippedCount++;
        errors.push(
          `Row ${rowNumber}: missing title/author/category (check column names — expected: title, isbn, author, category)`,
        );
        return;
      }

      // Empty or duplicate ISBNs get a generated one so placeholder values
      // like "111" don't block every row after the first.
      if (!isbn || usedIsbns.has(isbn)) {
        isbn = generateIsbn();
        warnings.push(
          `Row ${rowNumber} ("${title}"): ISBN missing or duplicated — assigned ${isbn}`,
        );
      }
      usedIsbns.add(isbn);

      // Covers are optional — import the book without one if there is no
      // cover_file column or the file is not in the ZIP.
      const coverFile = String(row.cover_file || "").trim();
      let coverBuffer: Buffer | null = null;
      let coverDbPath: string | null = null;
      let coverFullPath: string | null = null;
      const normalize = (p: string) => p.replace(/\\/g, "/").toLowerCase();

      if (coverFile) {
        const coverKey = normalize(`covers/${coverFile}`);
        coverBuffer =
          fileMap.get(coverKey) ||
          [...fileMap.entries()].find(([k]) => k.endsWith(coverKey))?.[1] ||
          null;

        if (!coverBuffer) {
          warnings.push(
            `Row ${rowNumber} ("${title}"): cover not found in ZIP: ${coverFile} — imported without cover`,
          );
        } else {
          const coverPath = getZipUploadPath("covers");
          const coverFileName = `${crypto.randomUUID()}-${sanitizeFileName(coverFile)}`;
          coverFullPath = join(coverPath.dir, coverFileName);
          await writeFile(coverFullPath, coverBuffer);
          coverDbPath = `${coverPath.dbPath}/${coverFileName}`;
        }
      } else if (fileMap.size > 0) {
        warnings.push(
          `Row ${rowNumber} ("${title}"): no cover_file column — imported without cover`,
        );
      }

      /* -----------------------------
         SAVE EBOOK (optional)
      ----------------------------- */
      const ebookFile = String(row.ebook_file || "").trim();
      let ebookDbPath: string | null = null;

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

      const toStr = (v: unknown) => (v ? String(v) : null);
      const authorId = await getAuthorId(authorName);
      const categoryId = await getCategoryId(categoryName);
      const copiesCount = row.copies ? Number(row.copies) : 1;

      // Semester cell may contain an id, slug, or name — resolve to the real id
      const rawSemester = String(row.semester || "").trim();
      const semesterId = rawSemester
        ? (semesterByKey.get(rawSemester.toLowerCase()) ?? null)
        : null;

      const insertBook = async (finalIsbn: string) => {
        await prisma.$transaction(async (tx: any) => {
          const book = await tx.book.create({
            data: {
              title,
              isbn: finalIsbn,
              coverImage: coverDbPath,
              authorId,
              categoryId,
              publisher: toStr(row.publisher),
              description: toStr(row.description),
              donate: toStr(row.donate),
              publicationYear: row.year ? Number(row.year) : null,
              language: toStr(row.language) || "English",
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
                semesterId: semesterId,
              },
            });
          }

          await tx.bookCopy.createMany({
            data: Array.from({ length: copiesCount }).map((_, i) => ({
              bookId: book.id,
              barcode: generateBarcode(finalIsbn, i),
              status: "AVAILABLE",
              shelfLocation: toStr(row.shelfLocation) || "Unassigned",
            })),
          });
        });
      };

      try {
        await insertBook(isbn);
        processedCount++;
      } catch (err) {
        // ISBN already exists in the DB (e.g. re-importing the same file) —
        // retry once with a generated ISBN instead of dropping the row.
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("unique constraint")) {
          const retryIsbn = generateIsbn();
          usedIsbns.add(retryIsbn);
          warnings.push(
            `Row ${rowNumber} ("${title}"): ISBN "${isbn}" already exists — assigned ${retryIsbn}`,
          );
          try {
            await insertBook(retryIsbn);
            processedCount++;
          } catch (retryErr) {
            skippedCount++;
            errors.push(
              `Row ${rowNumber} ("${title}"): ${
                retryErr instanceof Error ? retryErr.message : String(retryErr)
              }`,
            );
            if (coverFullPath) unlink(coverFullPath).catch(() => {});
          }
        } else {
          skippedCount++;
          errors.push(`Row ${rowNumber} ("${title}"): ${message}`);
          if (coverFullPath) unlink(coverFullPath).catch(() => {});
        }
      }
    };

    // Rows are independent — process several at once (stays under the Prisma
    // pool limit) so imports don't take minutes over a slow connection.
    const CONCURRENCY = 5;
    const queue = rows.map((row, i) => ({ row, rowNumber: i + 1 }));
    await Promise.all(
      Array.from({ length: CONCURRENCY }).map(async () => {
        while (queue.length) {
          const next = queue.shift();
          if (!next) break;
          await processRow(next.row, next.rowNumber);
        }
      }),
    );

    return NextResponse.json({
      success: true,
      inserted: processedCount,
      skipped: skippedCount,
      errors: errors.slice(0, 50),
      warnings: warnings.slice(0, 50),
      hint:
        processedCount === 0 && skippedCount > 0
          ? "No books were imported. Make sure your Excel sheet has a header row with columns: Title, ISBN, Author, Category. A title row above the headers is fine."
          : undefined,
    });
  } catch (err) {
    console.error("Bulk Import Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 },
    );
  }
}
