import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { toNextResponse } from "@/lib/errors";
import { requireRole, ALLOWED_ADMIN_ROLES } from "@/lib/services/auth.service";

export async function POST(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);
    const { librarians } = await req.json();
    if (!Array.isArray(librarians)) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const results: any[] = [];
    for (const lib of librarians) {
      try {
        const newUser = await auth.api.signUpEmail({
          body: {
            email: lib.email,
            password: lib.password || "UCSTgoLibraryAdmin@2026",
            name: lib.name,
          },
        });
        await prisma.user.update({
          where: { id: newUser.user.id },
          data: { role: "LIBRARIAN", emailVerified: true },
        });
        results.push({ email: lib.email, status: "success" });
      } catch (err: any) {
        results.push({ email: lib.email, status: "error", message: err.message });
      }
    }

    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    return toNextResponse(error);
  }
}
