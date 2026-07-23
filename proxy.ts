import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

import prisma from "@/lib/prisma";

export async function proxy(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;

  const isNextAction = req.headers.get("next-action") !== null;
  const isServerAction =
    req.headers.get("content-type")?.includes("form-data") || isNextAction;

  if (req.method !== "GET" && isServerAction) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({
    headers: req.headers,
  });

  // not logged in
  if (!session?.user) {
    if (path === "/student" || path === "/student/dashboard") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // get real user from DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 🔒 ROLE PROTECTION MAP
  const roleRules: Record<string, string> = {
    ADMIN: "/admin/dashboard",
    STUDENT: "/student/dashboard",
    LIBRARIAN: "/librarian/dashboard",
    LECTURER: "/lecturer/ebooks",
  };
  const role = user.role;

  // check route access
  if (path.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL(roleRules[role], req.url));
  }

  if (path.startsWith("/student") && role !== "STUDENT") {
    return NextResponse.redirect(new URL(roleRules[role], req.url));
  }

  if (path.startsWith("/librarian") && role !== "LIBRARIAN") {
    return NextResponse.redirect(new URL(roleRules[role], req.url));
  }

  if (path.startsWith("/lecturer") && role !== "LECTURER") {
    return NextResponse.redirect(new URL(roleRules[role], req.url));
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
