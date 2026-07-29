import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toNextResponse } from "@/lib/errors";
import { requireRole, ALLOWED_ADMIN_ROLES } from "@/lib/services/auth.service";

export async function POST(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);
    const { teachers } = await req.json();
    if (!Array.isArray(teachers)) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const results: any[] = [];
    for (const t of teachers) {
      try {
        const created = await auth.api.createUser({
          body: {
            email: t.email,
            password: t.password || "UCSTgoTeacher@2026",
            name: t.name,
            role: "LECTURER" as any,
            data: { emailVerified: true },
          },
        });
        await prisma.user.update({
          where: { id: created.user.id },
          data: {
            faculty: t.faculty || null,
            phone: t.phone || null,
          },
        });
        results.push({ email: t.email, status: "success" });
      } catch (err: any) {
        results.push({ email: t.email, status: "error", message: err.message });
      }
    }

    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    return toNextResponse(error);
  }
}
