"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { Role } from "../generated/prisma/enums";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized: Only administrators can manage library rules.");
  }
}

export async function getLibraryRules() {
  try {
    const rules = await prisma.libraryRule.findMany({
      orderBy: { createdAt: "asc" },
    });
    return { success: true, data: rules };
  } catch {
    return { success: false, error: "Failed to fetch library rules." };
  }
}

export async function createLibraryRule(formData: FormData) {
  try {
    await requireAdmin();

    const content = formData.get("content") as string;
    if (!content) {
      throw new Error("Rule content is required.");
    }

    await prisma.libraryRule.create({
      data: { content },
    });

    revalidatePath("/admin/sys-config");
    revalidatePath("/student/dashboard");
    return { success: true, message: "Library rule added successfully!" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteLibraryRule(id: string) {
  try {
    await requireAdmin();
    await prisma.libraryRule.delete({ where: { id } });

    revalidatePath("/admin/sys-config");
    revalidatePath("/student/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
