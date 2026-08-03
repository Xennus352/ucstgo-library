import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toNextResponse } from "@/lib/errors";
import { requireSession } from "@/lib/services/auth.service";

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireSession(request.headers);

    const notifications = await prisma.notification.findMany({
      where: { OR: [{ userId: user.id }, { userId: null }] },
      include: {
        sender: { select: { name: true, role: true } },
        reads: { where: { userId: user.id }, select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });

    const formatted = notifications.map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      sender: n.sender,
      isRead: n.reads.length > 0,
    }));

    return NextResponse.json({ success: true, notifications: formatted });
  } catch (error) {
    return toNextResponse(error);
  }
}
