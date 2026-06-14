import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";


export async function GET(req: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (
    !session?.user ||
    (session.user.role !== "ADMIN" && session.user.role !== "LIBRARIAN")
  ) {
    return NextResponse.json(
      { message: "Unauthorized Administrative Access" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);

    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);
    const search = searchParams.get("search")?.trim();
    const skip = (page - 1) * limit;

    // Use a structured object for the where clause
    const whereCondition = {
      role: "LECTURER" as const,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { faculty: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    // 🚀 PARALLEL QUERY: Executed against indexed columns
    const [teachers, total] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true,
          banned: true,
          faculty: true,
          phone: true,
        },
      }),
      prisma.user.count({ where: whereCondition }),
    ]);

    return NextResponse.json({
      data: teachers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[TEACHERS_SERVER_GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Only ADMIN can create teachers" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password, phone, faculty } = body;

    // Create user via Better Auth
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
    });

    if (!result.user?.id) throw new Error("User creation failed");

    // Update with Teacher-specific fields
    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        phone,
        faculty,
        role: "LECTURER",
        emailVerified: true,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("[TEACHERS_SERVER_POST]", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}