import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { unauthorized, forbidden } from "@/lib/errors";
import { logger } from "@/lib/logger";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string | null;
};

const ROLE_HIERARCHY: Record<string, number> = {
  STUDENT: 0,
  LECTURER: 1,
  LIBRARIAN: 2,
  ADMIN: 3,
} as const;

const ROLE_DEFAULT_ROUTES: Record<string, string> = {
  ADMIN: "/admin/dashboard",
  STUDENT: "/student/dashboard",
  LIBRARIAN: "/librarian/dashboard",
  LECTURER: "/lecturer/ebooks",
};

export async function getSession(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  logger.debug({ userId: session?.user?.id, role: session?.user?.role }, "Session retrieved");
  return session;
}

export async function requireSession(headers: Headers) {
  const session = await getSession(headers);
  if (!session?.user) {
    logger.warn("Unauthorized: No session");
    throw unauthorized();
  }
  return session as { user: SessionUser };
}

export async function requireRole(
  headers: Headers,
  allowedRoles: string[],
) {
  const { user } = await requireSession(headers);
  if (!allowedRoles.includes(user.role)) {
    logger.warn({ userId: user.id, userRole: user.role, allowedRoles }, "Forbidden: Insufficient role");
    throw forbidden(
      `Requires one of: ${allowedRoles.join(", ")}`,
    );
  }
  return user;
}

export function hasMinimumRole(
  userRole: string,
  minimumRole: string,
): boolean {
  return (ROLE_HIERARCHY[userRole] ?? -1) >= (ROLE_HIERARCHY[minimumRole] ?? 0);
}

export function getDefaultRoute(role: string): string {
  return ROLE_DEFAULT_ROUTES[role] ?? "/";
}

export async function getDbUserRole(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role ?? null;
}

export const ALLOWED_BOOK_ROLES = ["LECTURER", "LIBRARIAN", "ADMIN"];
export const ALLOWED_ADMIN_ROLES = ["ADMIN"];
export const ALLOWED_STAFF_ROLES = ["LIBRARIAN", "ADMIN"];
