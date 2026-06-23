import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Get all notifications visible to this user
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId: userId },
          { userId: null }, // global notifications
        ],
      },
      select: {
        id: true,
      },
    });

    if (notifications.length === 0) {
      return NextResponse.json({ success: true });
    }

    // Mark as read for THIS user only
    await prisma.notificationRead.createMany({
      data: notifications.map((n) => ({
        notificationId: n.id,
        userId,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      marked: notifications.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    );
  }
}
