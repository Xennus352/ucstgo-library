import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  toNextResponse,
  notFound,
  validation,
} from "@/lib/errors";
import { requireRole, ALLOWED_ADMIN_ROLES } from "@/lib/services/auth.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const status = body?.status;
    if (!["open", "investigating", "resolved"].includes(status)) {
      return toNextResponse(validation("Invalid status", { status }));
    }

    const existing = await prisma.errorLog.findUnique({ where: { id } });
    if (!existing) throw notFound("Issue");

    const updated = await prisma.errorLog.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return toNextResponse(error);
  }
}
