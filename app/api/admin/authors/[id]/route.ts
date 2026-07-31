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
      throw validation("Author name is required");
    }

    const existing = await prisma.author.findUnique({ where: { id } });
    if (!existing) throw notFound("Author");

    try {
      const author = await prisma.author.update({
        where: { id },
        data: { name: name.trim() },
      });
      return NextResponse.json({ data: author });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw conflict(`Author "${name.trim()}" already exists`);
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

    const author = await prisma.author.findUnique({
      where: { id },
      include: { _count: { select: { books: true } } },
    });
    if (!author) throw notFound("Author");

    if (author._count.books > 0) {
      throw conflict(
        `Cannot delete author "${author.name}" — ${author._count.books} book(s) are linked to this author. Reassign those books first.`,
      );
    }

    await prisma.author.delete({ where: { id } });
    return NextResponse.json({ message: "Author deleted successfully" });
  } catch (error) {
    return toNextResponse(error);
  }
}
