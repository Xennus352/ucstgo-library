import { Role } from "@/types/Role";

export const roleRoutes: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  LIBRARIAN: "/librarian/dashboard",
  LECTURER: "/lecturer/ebooks",
  STUDENT: "/student/dashboard",
};