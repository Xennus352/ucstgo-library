import fs from "fs/promises";
import path from "path";

export async function getKnowledge() {
  const filePath = path.join(process.cwd(), "app", "knowledge", "data.md");

  return fs.readFile(filePath, "utf8");
}

export function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text);
  } catch {
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return fallback;
  }
}