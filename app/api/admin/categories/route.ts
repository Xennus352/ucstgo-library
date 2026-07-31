import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { toNextResponse, validation, conflict } from "@/lib/errors";
import { requireRole, ALLOWED_STAFF_ROLES } from "@/lib/services/auth.service";

export async function GET(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_STAFF_ROLES);
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 10, 1);
    const search = searchParams.get("search")?.trim();
    const skip = (page - 1) * limit;

    const where = search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {};

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
        include: { _count: { select: { books: true } } },
      }),
      prisma.category.count({ where }),
    ]);

    return NextResponse.json({
      data: categories,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return toNextResponse(error);
  }
}

export async function POST(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_STAFF_ROLES);
    const { name } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      throw validation("Category name is required");
    }

    try {
      const category = await prisma.category.create({
        data: { name: name.trim() },
      });
      return NextResponse.json({ data: category }, { status: 201 });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw conflict(`Category "${name.trim()}" already exists`);
      }
      throw error;
    }
  } catch (error) {
    return toNextResponse(error);
  }
}
