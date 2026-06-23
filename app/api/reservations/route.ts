import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ReservationStatus } from "@/app/generated/prisma/enums";


export async function GET(req: Request) {
  try {
    // 1. Authenticate user session
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // 2. Parse and sanitize query parameters
    const { searchParams } = new URL(req.url);
    
    let page = parseInt(searchParams.get("page") || "1", 10);
    let limit = parseInt(searchParams.get("limit") || "10", 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    limit = Math.min(limit, 50);

    const skip = (page - 1) * limit;

    const isPrivilegedUser = userRole === "ADMIN" || userRole === "LIBRARIAN";
    
    // Explicitly use the precise typed array instead of generic strings
    const allowedStatuses: ReservationStatus[] = ["ACTIVE", "FULFILLED", "EXPIRED"];

    // 3. Build typed 'where' clause
    const whereClause = {
      status: {
        in: allowedStatuses,
      },
      ...(isPrivilegedUser ? {} : { userId: userId }),
    };

    // 4. Query Database concurrently
    const [reservations, total] = await prisma.$transaction([
      prisma.reservation.findMany({
        where: whereClause,
        orderBy: {
          reservedAt: "desc",
        },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          reservedAt: true,
          expiresAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              studentId: true,
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              coverImage: true,
              author: {
                select: {
                  name: true,
                },
              },
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),

      prisma.reservation.count({
        where: whereClause,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: reservations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch reservations",
      },
      { status: 500 },
    );
  }
}