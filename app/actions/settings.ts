"use server";

import { revalidatePath } from "next/cache";
import  prisma from "@/lib/prisma";

// Structure type for the frontend
export interface LibrarySettings {
  about_p1: string;
  about_p2: string;
  vision: string;
  mission: string;
  motivation_en: string;
  motivation_mm: string;
}

/**
 * Fetch all library system settings and map them into a clean key-value object
 */
export async function getLibrarySettings(): Promise<LibrarySettings> {
  try {
    const settingsArray = await prisma.systemSetting.findMany();

    // Map rows to an object
    const settingsObj = settingsArray.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, string>);

    // Return mapped keys with reliable fallback text
    return {
      about_p1: settingsObj.about_p1 || "Welcome to our University Library...",
      about_p2: settingsObj.about_p2 || "",
      vision: settingsObj.vision || "",
      mission: settingsObj.mission || "",
      motivation_en: settingsObj.motivation_en || "",
      motivation_mm: settingsObj.motivation_mm || "",
    };
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    throw new Error("Could not retrieve system settings.");
  }
}

/**
 * Update system settings dynamically using upsert (insert or update)
 */
export async function updateLibrarySettings(data: Partial<LibrarySettings>) {
  try {
    // Process records in a database transaction for performance and safety
    await prisma.$transaction(
      Object.entries(data).map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value: value ?? "" },
          create: {
            key,
            value: value ?? "",
            description: `Managed via Admin Dashboard under ${key}`,
          },
        })
      )
    );

    // Refresh the home layout cache automatically
    revalidatePath("/");
    return { success: true, message: "Settings updated successfully!" };
  } catch (error) {
    console.error("Failed to save settings:", error);
    return { success: false, message: "Something went wrong saving settings." };
  }
}