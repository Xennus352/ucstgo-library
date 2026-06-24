"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function banUserAction(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { banned: true },
    });

    // Clear caches to ensure layout synchronization
    revalidatePath("/librarian/dashboard");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: "User has been blacklisted successfully.",
    };
  } catch (error: any) {
    console.error("Ban action error:", error);
    return {
      success: false,
      error: error.message || "Failed to update user profile.",
    };
  }
}
