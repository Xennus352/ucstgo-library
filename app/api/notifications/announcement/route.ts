import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toNextResponse } from "@/lib/errors";
import { requireRole, ALLOWED_STAFF_ROLES } from "@/lib/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request.headers, ALLOWED_STAFF_ROLES);
    const { title, message } = await request.json();

    const notification = await prisma.notification.create({
      data: { title, message, userId: null, senderId: user.id },
    });

    global.io?.emit("new-notification", notification);

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
    });
  } catch (error) {
    return toNextResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request.headers, ALLOWED_STAFF_ROLES);

    const history = await prisma.notification.findMany({
      where: { userId: null },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    return toNextResponse(error);
  }
}
