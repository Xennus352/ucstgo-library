import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toNextResponse, forbidden, notFound } from "@/lib/errors";
import { requireRole, ALLOWED_STAFF_ROLES } from "@/lib/services/auth.service";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireRole(request.headers, ALLOWED_STAFF_ROLES);
    const { id } = await params;

    const existing = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true, senderId: true },
    });
    if (!existing) throw notFound("Notification");

    // Staff may only delete their own sends; broadcasts by anyone (staff)
    if (existing.senderId && existing.senderId !== user.id) {
      throw forbidden("You can only delete notifications you sent");
    }

    await prisma.notification.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return toNextResponse(error);
  }
}
