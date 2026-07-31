"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { Role } from "../generated/prisma/enums";
import { auth } from "@/lib/auth";
import { logActionIssue, errorMessage, errorStack } from "@/lib/log-error";

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
  } catch (error: unknown) {
    void logActionIssue(
      "getLibraryRules",
      `Failed to fetch library rules: ${errorMessage(error)}`,
      { severity: "error", stack: errorStack(error) },
    );
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
    void logActionIssue(
      "createLibraryRule",
      `Failed to add library rule: ${error?.message || "unknown error"}`,
      { severity: "error", stack: error?.stack ?? null },
    );
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
    void logActionIssue(
      "deleteLibraryRule",
      `Failed to delete library rule: ${error?.message || "unknown error"}`,
      { severity: "error", stack: error?.stack ?? null },
    );
    return { success: false, error: error.message };
  }
}

export async function updateLibraryRule(
  id: string,
  formData: FormData,
) {
  try {
    await requireAdmin();

    const content = formData.get("content") as string;
    if (!content) {
      throw new Error("Rule content is required.");
    }

    await prisma.libraryRule.update({
      where: { id },
      data: { content },
    });

    revalidatePath("/admin/sys-config");
    revalidatePath("/student/dashboard");
    return { success: true, message: "Library rule updated successfully!" };
  } catch (error: any) {
    void logActionIssue(
      "updateLibraryRule",
      `Failed to update library rule: ${error?.message || "unknown error"}`,
      { severity: "error", stack: error?.stack ?? null },
    );
    return { success: false, error: error.message };
  }
}
