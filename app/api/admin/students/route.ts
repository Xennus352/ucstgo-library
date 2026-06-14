import { auth } from "@/lib/auth"; 
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";


// 1. GET: Handles Server-Side Pagination, Debounced searching and relationship counts
export async function GET(req: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  // Security Gate: Ensure user is authenticated and holds administrative privileges
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "LIBRARIAN")) {
    return Response.json({ message: "Unauthorized Administrative Access" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    // Filter constraints strictly target students and conditionally lookup search parameters
    const whereCondition = {
      role: "STUDENT" as const,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { studentId: { contains: search, mode: "insensitive" as const } },
            { faculty: { contains: search, mode: "insensitive" as const } },
          ]
        : undefined,
    };

    // Parallel processing execution to avoid waterfall bottleneck delays
    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          createdAt: true,
          updatedAt: true,
          studentId: true,
          role: true,
          faculty: true,
          phone: true,
          _count: {
            select: {
              borrowRecords: true,
              reservations: true,
            },
          },
        },
      }),
      prisma.user.count({ where: whereCondition }),
    ]);

    return Response.json({
      data: students,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[STUDENTS_SERVER_GET]", error);
    return Response.json({ message: "Internal server registry fault" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "LIBRARIAN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password, phone, studentId, faculty } = body;

    // 1. Create the user through Better Auth (handles hashing automatically)
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      
      },
    });

    // 2. Update the additional fields
    // Ensure the ID exists in the result
    if (!result.user?.id) throw new Error("User creation failed");

    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        phone,
        studentId,
        faculty,
        role: "STUDENT",
        emailVerified: true, // Auto-verify admin-created accounts
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error("[STUDENTS_SERVER_POST]", error);
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}