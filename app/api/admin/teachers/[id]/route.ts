import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { headers } from "next/headers";
import { NextResponse } from "next/server";

// 1. PATCH: Update Teacher Details
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  // Only Admin/Librarian can update
  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "LIBRARIAN")
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, phone, faculty, password, banned } = await req.json();

    // Update Profile Fields
    const updatedUser = await prisma.user.update({
      where: { id, role: "LECTURER" }, // Enforce role constraint
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(faculty !== undefined && { faculty }),
        ...(banned !== undefined && { banned }),
      },
    });

    // Update Password via Auth API if provided
    if (password && password.trim().length > 0) {
      await (auth.api as any).updateUser({
        headers: reqHeaders,
        body: { id, password: password.trim() },
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("[TEACHERS_SERVER_PATCH]", error);
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

// 2. DELETE: Remove Teacher
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  // Only Admin can delete teachers
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    // Transaction to ensure data integrity
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.account.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id, role: "LECTURER" } }),
    ]);

    return NextResponse.json({ message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("[TEACHERS_SERVER_DELETE]", error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}