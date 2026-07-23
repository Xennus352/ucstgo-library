import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toNextResponse } from "@/lib/errors";
import { requireRole, ALLOWED_STAFF_ROLES, ALLOWED_ADMIN_ROLES } from "@/lib/services/auth.service";
import { createUser } from "@/lib/services/user.service";

export async function GET(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_STAFF_ROLES);
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);
    const search = searchParams.get("search")?.trim();
    const skip = (page - 1) * limit;

    const where: any = { role: "LECTURER" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { faculty: { contains: search, mode: "insensitive" } },
      ];
    }

    const [teachers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip, take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, createdAt: true,
          role: true, banned: true, faculty: true, phone: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: teachers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return toNextResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);
    const { name, email, password, phone, faculty } = await req.json();

    await createUser({
      name, email, password, role: "LECTURER",
      faculty, phone,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return toNextResponse(error);
  }
}
