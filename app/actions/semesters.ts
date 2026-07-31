"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { Role } from "../generated/prisma/enums";
import { auth } from "@/lib/auth";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

/** * CREATE A NEW SEMESTER
 */
export async function createSemester(name: string) {
  try {
    // 1. Pass the active request headers into Better-Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== Role.ADMIN) {
      throw new Error("Unauthorized: Only administrators can add semesters.");
    }

    const slug = slugify(name);

    const newSemester = await prisma.semester.create({
      data: {
        name,
        slug,
      },
    });

    revalidatePath("/admin/books");

    return { success: true, data: newSemester };
  } catch (error: any) {
    return {
      success: false,
      error:
        error.message || "Failed to create semester. It might already exist.",
    };
  }
}

/**
 * FETCH ALL SEMESTERS
 */
export async function getAllSemesters() {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });
    return { success: true, data: semesters };
  } catch (error) {
    return { success: false, error: "Failed to fetch semesters." };
  }
}

/**
 * UPDATE A SEMESTER
 */
export async function updateSemester(semesterId: string, name: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== Role.ADMIN) {
      throw new Error("Unauthorized: Only administrators can update semesters.");
    }

    const slug = slugify(name);

    const updatedSemester = await prisma.semester.update({
      where: { id: semesterId },
      data: { name, slug },
    });

    revalidatePath("/admin/books");
    revalidatePath("/admin/sys-config");
    revalidatePath("/student/dashboard");
    revalidatePath("/lecturer/ebooks");

    return { success: true, data: updatedSemester };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to update semester.",
    };
  }
}

/**
 * DELETE A SEMESTER
 */
export async function deleteSemester(semesterId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== Role.ADMIN) {
      throw new Error("Unauthorized");
    }

    // 1. Unlink books from this semester before deleting it
    await prisma.ebook.updateMany({
      where: { semesterId: semesterId },
      data: { semesterId: null }, // Or handle cascading according to your schema
    });

    // 2. Delete the semester safely
    await prisma.semester.delete({
      where: { id: semesterId },
    });

    revalidatePath("/admin/books");
    revalidatePath("/admin/sys-config"); 
    revalidatePath("/student/dashboard")
    revalidatePath("/lecturer/ebooks")

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
