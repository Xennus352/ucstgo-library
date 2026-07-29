import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toNextResponse } from "@/lib/errors";
import { requireRole, ALLOWED_STAFF_ROLES } from "@/lib/services/auth.service";

export async function POST(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_STAFF_ROLES);
    const { students } = await req.json();
    if (!Array.isArray(students)) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const results: any[] = [];
    for (const s of students) {
      try {
        const created = await auth.api.createUser({
          body: {
            email: s.email,
            password: s.password || "UCSTgoStudent@2026",
            name: s.name,
            role: "STUDENT" as any,
            data: { emailVerified: true },
          },
        });
        await prisma.user.update({
          where: { id: created.user.id },
          data: {
            studentId: s.studentId || null,
            faculty: s.faculty || null,
            phone: s.phone || null,
          },
        });
        results.push({ email: s.email, status: "success" });
      } catch (err: any) {
        results.push({ email: s.email, status: "error", message: err.message });
      }
    }

    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    return toNextResponse(error);
  }
}
