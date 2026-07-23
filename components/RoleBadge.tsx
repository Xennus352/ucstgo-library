import { roleBadge } from "@/lib/design-tokens";

export function RoleBadge({ role }: { role: string }) {
  const validRole = ["ADMIN", "LIBRARIAN", "STUDENT", "LECTURER"].includes(role)
    ? (role as "ADMIN" | "LIBRARIAN" | "STUDENT" | "LECTURER")
    : "STUDENT";

  return <span className={roleBadge({ role: validRole })}>{role}</span>;
}
