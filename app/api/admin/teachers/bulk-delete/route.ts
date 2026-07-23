import prisma from "@/lib/prisma";
import { toNextResponse } from "@/lib/errors";
import { requireRole, ALLOWED_ADMIN_ROLES } from "@/lib/services/auth.service";

export async function DELETE(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ message: "Missing IDs" }, { status: 400 });
    }

    const [, , deletedUsers] = await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: { in: ids } } }),
      prisma.account.deleteMany({ where: { userId: { in: ids } } }),
      prisma.user.deleteMany({ where: { id: { in: ids } } }),
    ]);

    return Response.json({
      message: "Bulk accounts deleted.",
      count: deletedUsers.count,
    });
  } catch (error) {
    return toNextResponse(error);
  }
}
