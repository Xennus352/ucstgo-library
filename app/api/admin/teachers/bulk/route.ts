import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  // Only Admins should perform bulk teacher imports
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized: Admins only" }, { status: 401 });
  }

  try {
    const { teachers } = await req.json();
    if (!Array.isArray(teachers)) {
      return NextResponse.json({ message: "Invalid payload: 'teachers' array expected" }, { status: 400 });
    }

    const results = [];

    for (const teacher of teachers) {
      try {
        // 1. Create User via Better Auth
        const newUser = await auth.api.signUpEmail({
          body: {
            email: teacher.email,
            password: teacher.password || "UCSTgoTeacher@2026", // Default password policy
            name: teacher.name,
          },
        });

        // 2. Update custom Lecturer fields
        await prisma.user.update({
          where: { id: newUser.user.id },
          data: {
            role: "LECTURER", // Assign the specific role
            faculty: teacher.faculty || null,
            phone: teacher.phone || null,
            emailVerified: true, // Auto-verify for admin-managed imports
          },
        });

        results.push({ email: teacher.email, status: "success" });
      } catch (err: any) {
        console.error(`Bulk import error for ${teacher.email}:`, err.message);
        results.push({ email: teacher.email, status: "error", message: err.message });
      }
    }

    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    console.error("[TEACHERS_SERVER_BULK_IMPORT]", error);
    return NextResponse.json({ message: "Bulk import process failed" }, { status: 500 });
  }
}