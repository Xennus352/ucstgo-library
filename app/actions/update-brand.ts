"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { logActionIssue, errorMessage, errorStack } from "@/lib/log-error";

export async function updateBrand(formData: FormData) {
  try {
    const name = formData.get("name")?.toString().trim();
  const logo = formData.get("logo") as File | null;
  const faviconFile = formData.get("favicon") as File | null;
  const title = formData.get("title")?.toString().trim();

  const configPath = path.join(process.cwd(), "config", "brand.ts");

  // Read current config
  const configText = await fs.readFile(configPath, "utf8");

  const currentName =
    configText.match(/name:\s*"([^"]*)"/)?.[1] ?? "UCSTaungoo Digital Library";

  const currentLogo =
    configText.match(/logo:\s*"([^"]*)"/)?.[1] ?? "/images/brand.png";

  const currentFavicon =
    configText.match(/favicon:\s*"([^"]*)"/)?.[1] ?? "/icon.png";

  const currentTitle =
    configText.match(/title:\s*"([^"]*)"/)?.[1] ?? `${currentName} Digital Library`;

  let logoPath = currentLogo;

  // Upload logo if provided
  if (logo && logo.size > 0) {
    const buffer = Buffer.from(await logo.arrayBuffer());

    const ext = path.extname(logo.name) || ".png";

    const stamp = Date.now();
    const filename = `brand_${stamp}${ext}`;

    const imageDir = path.join(process.cwd(), "public", "images");

    await fs.mkdir(imageDir, { recursive: true });

    await fs.writeFile(path.join(imageDir, filename), buffer);

    logoPath = `/images/${filename}`;
  }

  let faviconPath = currentFavicon;

  // Upload favicon if provided — overwrite app/icon.png so Next.js serves it at /icon.png
  if (faviconFile && faviconFile.size > 0) {
    const buffer = Buffer.from(await faviconFile.arrayBuffer());

    const appDir = path.join(process.cwd(), "app");
    await fs.writeFile(path.join(appDir, "icon.png"), buffer);

    faviconPath = "/icon.png";
  }

  const updatedAt = Date.now().toString();

  const newContent = `export const brandConfig = {
  name: ${JSON.stringify(name || currentName)},
  logo: ${JSON.stringify(logoPath)},
  favicon: ${JSON.stringify(faviconPath)},
  title: ${JSON.stringify(title || currentTitle)},
  updatedAt: ${JSON.stringify(updatedAt)},
} as const;
`;

  await fs.writeFile(configPath, newContent, "utf8");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/sys-config");
  revalidatePath("/librarian/dashboard");
  revalidatePath("/lecturer/home");
  revalidatePath("/student/dashboard");

  return {
    name: name || currentName,
    logo: logoPath,
    favicon: faviconPath,
    title: title || currentTitle,
    updatedAt,
  };
  } catch (error: unknown) {
    void logActionIssue(
      "updateBrand",
      `Failed to update brand config: ${errorMessage(error)}`,
      { severity: "error", stack: errorStack(error) },
    );
    throw error;
  }
}
