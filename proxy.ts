import { NextResponse } from "next/server";
import { getSession, getDbUserRole, getDefaultRoute } from "@/lib/services/auth.service";

export async function proxy(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;

  const isNextAction = req.headers.get("next-action") !== null;
  const isServerAction =
    req.headers.get("content-type")?.includes("form-data") || isNextAction;

  if (req.method !== "GET" && isServerAction) {
    return NextResponse.next();
  }

  const session = await getSession(req.headers);

  if (!session?.user) {
    if (path === "/student" || path === "/student/dashboard") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  const role = await getDbUserRole(session.user.id);

  if (!role) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const roleRoute = getDefaultRoute(role);
  const routePatterns: Record<string, string> = {
    "/admin": "ADMIN",
    "/student": "STUDENT",
    "/librarian": "LIBRARIAN",
    "/lecturer": "LECTURER",
  };

  for (const [prefix, allowedRole] of Object.entries(routePatterns)) {
    if (path.startsWith(prefix) && role !== allowedRole) {
      return NextResponse.redirect(new URL(roleRoute, req.url));
    }
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
