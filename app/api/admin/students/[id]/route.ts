import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";



export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reqHeaders = await headers();

  const session = await auth.api.getSession({ headers: reqHeaders });

  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "LIBRARIAN")
  ) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, phone, studentId, faculty, password } = await req.json();

    // -------------------------
    // 1. UPDATE PROFILE (DB ONLY)
    // -------------------------
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(studentId !== undefined && { studentId }),
        ...(faculty !== undefined && { faculty }),
      },
    });

    // -------------------------
    // 2. UPDATE PASSWORD (AUTH ONLY)
    // -------------------------
    const adminApi = auth.api as any;

    if (password && password.trim().length > 0) {
      await adminApi.updateUser({
        headers: reqHeaders,
        body: {
          id,
          password: password.trim(),
        },
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    console.error("[STUDENTS_SERVER_PATCH]", error);

    return NextResponse.json(
      { message: "Update failed" },
      { status: 500 }
    );
  }
}


export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  const { id } = await params;

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 403 }
    );
  }

  try {
    // Delete Better Auth records first
    await prisma.session.deleteMany({
      where: { userId: id },
    });

    await prisma.account.deleteMany({
      where: { userId: id },
    });

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("[STUDENTS_SERVER_DELETE]", error);

    return NextResponse.json(
      { message: "Delete failed" },
      { status: 500 }
    );
  }
}