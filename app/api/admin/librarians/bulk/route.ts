import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  // Tightened security: Only Admins can bulk import new Librarians
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized: Admins only" }, { status: 401 });
  }

  try {
    const { librarians } = await req.json();
    if (!Array.isArray(librarians)) {
      return NextResponse.json({ message: "Invalid payload: Expected an array" }, { status: 400 });
    }

    const results = [];

    for (const librarian of librarians) {
      try {
        // 1. Create User via Better Auth
        const newUser = await auth.api.signUpEmail({
          body: {
            email: librarian.email,
            password: librarian.password || "UCSTgoLibraryAdmin@2026",
            name: librarian.name,
          },
        });

        // 2. Set role to LIBRARIAN and apply profile data
        await prisma.user.update({
          where: { id: newUser.user.id },
          data: {
            role: "LIBRARIAN",
            phone: librarian.phone || null,
            emailVerified: true,
          },
        });

        results.push({ email: librarian.email, status: "success" });
      } catch (err: any) {
        console.error(`Import error for ${librarian.email}:`, err.message);
        results.push({ email: librarian.email, status: "error", message: err.message });
      }
    }

    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    console.error("[LIBRARIANS_SERVER_BULK]", error);
    return NextResponse.json({ message: "Bulk import failed" }, { status: 500 });
  }
}