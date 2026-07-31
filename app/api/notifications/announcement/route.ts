import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toNextResponse, validation } from "@/lib/errors";
import { requireRole, ALLOWED_STAFF_ROLES } from "@/lib/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request.headers, ALLOWED_STAFF_ROLES);
    const { title, message, userId } = await request.json();

    if (!title || !message) {
      return toNextResponse(
        validation("Title and message are required", { title, message }),
      );
    }

    let targetUserId: string | null = null;
    if (userId) {
      const target = await prisma.user.findUnique({
        where: { id: String(userId) },
        select: { id: true },
      });
      if (!target) {
        return toNextResponse(validation("Recipient user not found", { userId }));
      }
      targetUserId = target.id;
    }

    const notification = await prisma.notification.create({
      data: { title, message, userId: targetUserId, senderId: user.id },
    });

    if (targetUserId) {
      global.io?.to(targetUserId).emit("new-notification", notification);
    } else {
      global.io?.emit("new-notification", notification);
    }

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      targeted: !!targetUserId,
    });
  } catch (error) {
    return toNextResponse(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request.headers, ALLOWED_STAFF_ROLES);

    const history = await prisma.notification.findMany({
      where: { OR: [{ userId: null }, { senderId: { not: null } }] },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } },
        user: { select: { id: true, name: true, email: true, studentId: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, history });
  } catch (error) {
    return toNextResponse(error);
  }
}
