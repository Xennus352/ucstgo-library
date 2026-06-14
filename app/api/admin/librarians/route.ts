import { auth } from "@/lib/auth"; 
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// 1. GET: Fetch only Librarians
export async function GET(req: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  // Security Gate: Only Admins can manage other Librarians
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Unauthorized: Access restricted to Admins" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);
    const search = searchParams.get("search")?.trim();
    const skip = (page - 1) * limit;

    // Filter constraints: Librarian role only
    const whereCondition = {
      role: "LIBRARIAN" as const,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    // Parallel processing for optimal performance
    const [librarians, total] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
          banned: true,
        },
      }),
      prisma.user.count({ where: whereCondition }),
    ]);

    return NextResponse.json({
      data: librarians,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[LIBRARIANS_SERVER_GET]", error);
    return NextResponse.json(
      { message: "Internal server registry fault" },
      { status: 500 }
    );
  }
}

// 2. POST: Create a new Librarian
export async function POST(req: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, password, phone } = await req.json();

    // Create via Auth
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
    });

    if (!result.user?.id) throw new Error("Creation failed");

    // Update role to LIBRARIAN
    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        role: "LIBRARIAN",
        phone,
        emailVerified: true,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}