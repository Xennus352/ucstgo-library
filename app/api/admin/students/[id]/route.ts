import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { toNextResponse } from "@/lib/errors";
import { requireRole, ALLOWED_STAFF_ROLES } from "@/lib/services/auth.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(req.headers, ALLOWED_STAFF_ROLES);
    const { id } = await params;
    const { name, email, phone, studentId, faculty, password, banned } = await req.json();

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (studentId !== undefined) data.studentId = studentId;
    if (faculty !== undefined) data.faculty = faculty;
    if (banned !== undefined) data.banned = banned;

    const updated = await prisma.user.update({ where: { id }, data });

    if (password?.trim()) {
      await (auth.api as any).updateUser({
        headers: await headers(),
        body: { id, password: password.trim() },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return toNextResponse(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(req.headers, ["ADMIN"]);
    const { id } = await params;

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: id } }),
      prisma.account.deleteMany({ where: { userId: id } }),
      prisma.user.delete({ where: { id } }),
    ]);

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    return toNextResponse(error);
  }
}
