import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "LIBRARIAN")) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { students } = await req.json();
    if (!Array.isArray(students)) return NextResponse.json({ message: "Invalid payload" }, { status: 400 });

    const results = [];

    for (const student of students) {
      try {
        // 1. Better Auth handles hashing and table relationships automatically
        const newUser = await auth.api.signUpEmail({
          body: {
            email: student.email,
            password: student.password || "UCSTgoStudent@2026",
            name: student.name,
            
          },
        });

        // 2. Update additional custom fields
        await prisma.user.update({
          where: { id: newUser.user.id },
          data: {
            studentId: student.studentId || null,
            faculty: student.faculty || null,
            phone: student.phone || null,
            emailVerified: true,
          },
        });

        results.push({ email: student.email, status: "success" });
      } catch (err: any) {
        console.error(`Import error for ${student.email}:`, err.message);
        results.push({ email: student.email, status: "error", message: err.message });
      }
    }

    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    console.error("[STUDENTS_SERVER_BULK]", error);
    return NextResponse.json({ message: "Bulk import failed" }, { status: 500 });
  }
}