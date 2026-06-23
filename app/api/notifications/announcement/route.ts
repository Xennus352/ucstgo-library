import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/enums";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userRole = session.user.role as Role;

    if (userRole !== Role.ADMIN && userRole !== Role.LIBRARIAN) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { title, message } = await request.json();

    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        userId: null,
        senderId: session.user.id,
      },
    });

    // 🔥 REAL-TIME EMIT
    global.io?.emit("new-notification", notification);

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userRole = session.user.role as Role;

    if (userRole !== Role.ADMIN && userRole !== Role.LIBRARIAN) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const history = await prisma.notification.findMany({
      where: {
        userId: null, // ONLY global announcements
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 15,
    });

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
