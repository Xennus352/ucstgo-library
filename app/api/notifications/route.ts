import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    const notifications = await prisma.notification.findMany({
      where: {
        OR: [{ userId: userId }, { userId: null }],
      },
      include: {
        sender: {
          select: {
            name: true,
            role: true,
          },
        },
        reads: {
          where: {
            userId: userId,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
    });

    const formatted = notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      sender: n.sender,
      isRead: n.reads.length > 0,
    }));

    return NextResponse.json({
      success: true,
      notifications: formatted,
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
