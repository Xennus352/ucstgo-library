import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

import prisma from "@/lib/prisma";

export async function proxy(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  const url = new URL(req.url);
  const path = url.pathname;

  // not logged in
  if (!session?.user) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // get real user from DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // 🔒 ROLE PROTECTION MAP
  const roleRules: Record<string, string> = {
    ADMIN: "/admin",
    STUDENT: "/student",
    LIBRARIAN: "/librarian",
    LECTURER: "/lecturer",
  };
  const role = user.role;

  // check route access
  // ROLE PROTECTION MAP
  if (path.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  if (path.startsWith("/student") && role !== "STUDENT") {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  if (path.startsWith("/librarian") && role !== "LIBRARIAN") {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  if (path.startsWith("/lecturer") && role !== "LECTURER") {
    return NextResponse.redirect(new URL("/403", req.url));
  }

  return NextResponse.next();
}

// Apply only to protected routes
export const config = {
  matcher: [
    "/admin/:path*",
    "/student/:path*",
    "/librarian/:path*",
    "/lecturer/:path*",
  ],
};
