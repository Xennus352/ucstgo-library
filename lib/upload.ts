import prisma from "@/lib/prisma";
import { mkdir } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export const FILE_LIMITS = {
  cover: 5 * 1024 * 1024,
  ebook: 200 * 1024 * 1024,
  zipImport: 200 * 1024 * 1024,
} as const;

export function validateContentLength(
  contentLength: number | null,
  maxBytes: number,
): NextResponse | null {
  if (contentLength && contentLength > maxBytes) {
    return NextResponse.json(
      {
        error: `Request body too large. Maximum allowed is ${Math.round(maxBytes / 1024 / 1024)} MB.`,
      },
      { status: 413 },
    );
  }
  return null;
}

export function validateFileSize(
  file: File | null,
  maxBytes: number,
  label: string,
): NextResponse | null {
  if (file && file.size > maxBytes) {
    return NextResponse.json(
      {
        error: `${label} file too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed is ${Math.round(maxBytes / 1024 / 1024)} MB.`,
      },
      { status: 413 },
    );
  }
  return null;
}

export async function getOrCreateAuthor(name: string) {
  return await prisma.author.upsert({
    where: { name: name.trim() },
    update: {},
    create: { name: name.trim() },
  });
}

export async function getOrCreateCategory(name: string) {
  return await prisma.category.upsert({
    where: { name: name.trim() },
    update: {},
    create: { name: name.trim() },
  });
}

export function getUploadPath(type: "covers" | "ebooks") {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return {
    dir: join(process.cwd(), `public/uploads/books/${type}/${year}/${month}`),
    publicPath: `/uploads/books/${type}/${year}/${month}`,
  };
}

export async function ensureUploadDir(type: "covers" | "ebooks") {
  const { dir } = getUploadPath(type);
  await mkdir(dir, { recursive: true });
}

export function generateBarcode(isbn: string, index: number): string {
  const cleanIsbn = isbn.replace(/-/g, "");
  return `${cleanIsbn}-${String(index + 1).padStart(4, "0")}`;
}
