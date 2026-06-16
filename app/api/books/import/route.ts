import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import unzipper from "unzipper";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const zipFile = formData.get("file") as File;

    if (!zipFile) {
      return NextResponse.json({ error: "ZIP file required" }, { status: 400 });
    }

    const buffer = Buffer.from(await zipFile.arrayBuffer());

    // 📦 Extract ZIP
    const directory = await unzipper.Open.buffer(buffer);

    let excelBuffer: Buffer | null = null;
    const fileMap: Record<string, Buffer> = {};

    for (const file of directory.files) {
      if (file.type === "File") {
        const content = await file.buffer();

        if (file.path.endsWith(".xlsx")) {
          excelBuffer = content;
        } else {
          fileMap[file.path] = content;
        }
      }
    }

    if (!excelBuffer) {
      return NextResponse.json(
        { error: "Excel file missing in ZIP" },
        { status: 400 },
      );
    }

    // 📊 Read Excel
    const workbook = XLSX.read(excelBuffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const books: any[] = [];

    for (const row of rows as any[]) {
      const coverFile = row.cover_file;
      const ebookFile = row.ebook_file;

      if (!coverFile) {
        throw new Error(`Missing cover_file for ${row.title}`);
      }

      // 📁 Paths inside project
      const coverPath = `/uploads/covers/${coverFile}`;
      const ebookPath = ebookFile ? `/uploads/ebooks/${ebookFile}` : null;

      // 📌 Save cover image
      const coverBuffer = fileMap[`covers/${coverFile}`];
      if (!coverBuffer) {
        throw new Error(`Cover not found in ZIP: ${coverFile}`);
      }

      fs.mkdirSync(path.join(process.cwd(), "public/uploads/covers"), {
        recursive: true,
      });

      fs.writeFileSync(
        path.join(process.cwd(), "public", coverPath),
        coverBuffer,
      );

      // 📌 Save ebook (optional)
      if (ebookFile) {
        const ebookBuffer = fileMap[`ebooks/${ebookFile}`];

        if (ebookBuffer) {
          fs.mkdirSync(path.join(process.cwd(), "public/uploads/ebooks"), {
            recursive: true,
          });

          fs.writeFileSync(
            path.join(process.cwd(), "public", ebookPath!),
            ebookBuffer,
          );
        }
      }

      books.push({
        title: row.title,
        isbn: row.isbn,
        author: row.author,
        category: row.category,
        publisher: row.publisher || null,
        publicationYear: row.year ? Number(row.year) : null,
        language: row.language || "English",
        copies: row.copies ? Number(row.copies) : 1,
        coverImage: coverPath,
        ebookPath: ebookPath,
      });
    }

    await prisma.book.createMany({
      data: books,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      inserted: books.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Import failed" },
      { status: 500 },
    );
  }
}
