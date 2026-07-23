import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toNextResponse, notFound } from "@/lib/errors";
import { requireRole, ALLOWED_ADMIN_ROLES } from "@/lib/services/auth.service";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);
    const { id } = await props.params;
    const { name, email, phone } = await req.json();

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role !== "LIBRARIAN") throw notFound("Librarian");

    const updated = await prisma.user.update({
      where: { id },
      data: { name, email, phone },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return toNextResponse(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);
    const { id } = await params;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || targetUser.role !== "LIBRARIAN") {
      throw notFound("Librarian");
    }

    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.account.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "Librarian deleted successfully" });
  } catch (error) {
    return toNextResponse(error);
  }
}
