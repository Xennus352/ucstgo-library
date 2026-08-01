import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();

  const name = formData.get("name")?.toString().trim();
  const title = formData.get("title")?.toString().trim();
  const logo = formData.get("logo") as File | null;
  const faviconFile = formData.get("favicon") as File | null;

  if (name && name.length > 22) {
    return NextResponse.json(
      { error: "Institution name must be 22 characters or fewer." },
      { status: 400 },
    );
  }

  const configPath = path.join(process.cwd(), "config", "brand.ts");

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

  return NextResponse.json({
    name: name || currentName,
    logo: logoPath,
    favicon: faviconPath,
    title: title || currentTitle,
    updatedAt,
  });
}
