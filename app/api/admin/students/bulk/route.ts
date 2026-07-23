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
        const newUser = await auth.api.signUpEmail({
          body: {
            email: s.email,
            password: s.password || "UCSTgoStudent@2026",
            name: s.name,
          },
        });
        await prisma.user.update({
          where: { id: newUser.user.id },
          data: {
            role: "STUDENT",
            studentId: s.studentId || null,
            faculty: s.faculty || null,
            phone: s.phone || null,
            emailVerified: true,
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
