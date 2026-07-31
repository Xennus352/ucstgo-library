import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import {
  toNextResponse,
  notFound,
  validation,
  conflict,
} from "@/lib/errors";
import { requireRole, ALLOWED_STAFF_ROLES } from "@/lib/services/auth.service";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(req.headers, ALLOWED_STAFF_ROLES);
    const { id } = await params;
    const { name } = await req.json();

    if (!name || typeof name !== "string" || !name.trim()) {
      throw validation("Category name is required");
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw notFound("Category");

    try {
      const category = await prisma.category.update({
        where: { id },
        data: { name: name.trim() },
      });
      return NextResponse.json({ data: category });
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

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(req.headers, ALLOWED_STAFF_ROLES);
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    });
    if (!category) throw notFound("Category");

    if (category._count.books > 0) {
      throw conflict(
        `Cannot delete category "${category.name}" — it is used by ${category._count.books} book(s). Reassign those books first.`,
      );
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    return toNextResponse(error);
  }
}
