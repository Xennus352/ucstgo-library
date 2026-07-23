"use server";

import fs from "fs/promises";
import path from "path";

export interface BrandConfig {
  name: string;
  logo: string;
  favicon: string;
  title: string;
  updatedAt: string;
}

export async function getBrandConfig(): Promise<BrandConfig> {
  const configPath = path.join(process.cwd(), "config", "brand.ts");

  const defaults: BrandConfig = {
    name: "UCSTGO Library",
    logo: "/images/brand.png",
    favicon: "/icon.png",
    title: "UCSTGO Digital Library",
    updatedAt: "",
  };

  try {
    const configText = await fs.readFile(configPath, "utf8");

    const name = configText.match(/name:\s*"([^"]+)"/)?.[1];
    const logo = configText.match(/logo:\s*"([^"]+)"/)?.[1];
    const favicon = configText.match(/favicon:\s*"([^"]+)"/)?.[1];
    const updatedAt = configText.match(/updatedAt:\s*"([^"]+)"/)?.[1] ?? "";
    const title =
      configText.match(/title:\s*"([^"]+)"/)?.[1] ??
      (name ? `${name} Digital Library` : defaults.title);

    return {
      name: name ?? defaults.name,
      logo: logo ?? defaults.logo,
      favicon: favicon ?? defaults.favicon,
      title: title ?? defaults.title,
      updatedAt,
    };
  } catch {
    return defaults;
  }
}
