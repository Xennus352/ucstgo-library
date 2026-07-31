import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import { toNextResponse } from "@/lib/errors";
import { requireRole, ALLOWED_ADMIN_ROLES } from "@/lib/services/auth.service";

const VALID_ROLES = ["ADMIN", "LIBRARIAN", "STUDENT", "LECTURER"];

export async function GET(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);

    const url = new URL(req.url);
    const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit")) || 15, 1),
      50,
    );
    const search = url.searchParams.get("search")?.trim() ?? "";
    const role = (url.searchParams.get("role") ?? "").toUpperCase();
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    const where: Prisma.ActiveUserWhereInput = {
      lastSeenAt: { gte: fiveMinAgo },
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
      ];
    }
    if (VALID_ROLES.includes(role)) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.activeUser.findMany({
        where,
        orderBy: { lastSeenAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activeUser.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    });
  } catch (error) {
    return toNextResponse(error);
  }
}
