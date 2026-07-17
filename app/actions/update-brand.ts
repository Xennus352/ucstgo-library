"use server";

import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";

export async function updateBrand(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const logo = formData.get("logo") as File | null;

  const configPath = path.join(process.cwd(), "config", "brand.ts");

  // Read current config
  const configText = await fs.readFile(configPath, "utf8");

  const currentName =
    configText.match(/name:\s*"([^"]*)"/)?.[1] ?? "UCSTaungoo Digital Library";

  const currentLogo =
    configText.match(/logo:\s*"([^"]*)"/)?.[1] ?? "/images/brand.png";

  let logoPath = currentLogo;

  // Upload logo if provided
  if (logo && logo.size > 0) {
    const buffer = Buffer.from(await logo.arrayBuffer());

    const ext = path.extname(logo.name) || ".png";

    // Always overwrite
    const filename = `brand${ext}`;

    const imageDir = path.join(process.cwd(), "public", "images");

    await fs.mkdir(imageDir, { recursive: true });

    await fs.writeFile(path.join(imageDir, filename), buffer);

    logoPath = `/images/${filename}`;
  }

  const newContent = `export const brandConfig = {
  name: ${JSON.stringify(name || currentName)},
  logo: ${JSON.stringify(logoPath)},
} as const;
`;

  await fs.writeFile(configPath, newContent, "utf8");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/sys-config");
  revalidatePath("/librarian/dashboard");
  revalidatePath("/lecturer/home");
  revalidatePath("/student/dashboard");

  return { name: name || currentName, logo: logoPath };
}
