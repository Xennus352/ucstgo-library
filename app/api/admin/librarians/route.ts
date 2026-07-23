import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toNextResponse } from "@/lib/errors";
import { requireRole, ALLOWED_ADMIN_ROLES } from "@/lib/services/auth.service";
import { createUser } from "@/lib/services/user.service";

export async function GET(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);
    const search = searchParams.get("search")?.trim();
    const skip = (page - 1) * limit;

    const where: any = { role: "LIBRARIAN" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [librarians, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, phone: true,
          createdAt: true, updatedAt: true, banned: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: librarians,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return toNextResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);
    const { name, email, password, phone } = await req.json();

    await createUser({ name, email, password, role: "LIBRARIAN", phone });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return toNextResponse(error);
  }
}
