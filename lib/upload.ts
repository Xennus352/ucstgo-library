import prisma from "@/lib/prisma";
import { mkdir } from "fs/promises";
import { join } from "path";

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
