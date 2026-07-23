import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toNextResponse } from "@/lib/errors";
import { requireSession } from "@/lib/services/auth.service";

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireSession(request.headers);

    const notifications = await prisma.notification.findMany({
      where: { OR: [{ userId: user.id }, { userId: null }] },
      select: { id: true },
    });

    if (notifications.length === 0) {
      return NextResponse.json({ success: true });
    }

    await prisma.notificationRead.createMany({
      data: notifications.map((n) => ({
        notificationId: n.id,
        userId: user.id,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, marked: notifications.length });
  } catch (error) {
    return toNextResponse(error);
  }
}
