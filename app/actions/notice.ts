"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { Role } from "../generated/prisma/enums";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== Role.ADMIN) {
    throw new Error("Unauthorized: Only administrators can manage notices.");
  }
}

export async function getNotices() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: notices };
  } catch {
    return { success: false, error: "Failed to fetch notices." };
  }
}

export async function createNotice(formData: FormData) {
  try {
    await requireAdmin();

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const color = (formData.get("color") as string) || "red";

    if (!title || !content) {
      throw new Error("Title and content are required.");
    }

    await prisma.notice.create({
      data: { title, content, color },
    });

    revalidatePath("/admin/sys-config");
    revalidatePath("/student/dashboard");
    return { success: true, message: "Notice added successfully!" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteNotice(id: string) {
  try {
    await requireAdmin();
    await prisma.notice.delete({ where: { id } });

    revalidatePath("/admin/sys-config");
    revalidatePath("/student/dashboard");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
