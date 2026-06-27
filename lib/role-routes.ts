import { Role } from "@/types/Role";

export const roleRoutes: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  LIBRARIAN: "/librarian/dashboard",
  LECTURER: "/lecturer/home",
  STUDENT: "/student/dashboard",
};