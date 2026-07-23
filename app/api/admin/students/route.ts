import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toNextResponse, validation } from "@/lib/errors";
import { requireRole, ALLOWED_STAFF_ROLES } from "@/lib/services/auth.service";
import { createUser } from "@/lib/services/user.service";

export async function GET(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_STAFF_ROLES);
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: any = { role: "STUDENT" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
        { faculty: { contains: search, mode: "insensitive" } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, emailVerified: true,
          image: true, createdAt: true, updatedAt: true,
          studentId: true, role: true, faculty: true, banned: true, phone: true,
          _count: { select: { borrowRecords: true, reservations: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: students,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return toNextResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_STAFF_ROLES);
    const body = await req.json();
    const { name, email, password, phone, studentId, faculty, banned } = body;

    const result = await createUser({
      name, email, password, role: "STUDENT",
      studentId, faculty, phone,
    });

    if (banned !== undefined) {
      await prisma.user.update({
        where: { id: result.id },
        data: { banned: !!banned },
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    return toNextResponse(error);
  }
}
