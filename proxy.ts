import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function proxy(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  const url = req.nextUrl;
  const path = url.pathname;

  if (!session?.user) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, banned: true },
  });

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  const role = user.role;

  // ROLE PROTECTION ONLY
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