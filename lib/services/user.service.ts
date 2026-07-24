import prisma from "@/lib/prisma";
import { notFound, validation } from "@/lib/errors";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getIO } from "@/lib/socket";

export type UserCreateInput = {
  name: string;
  email: string;
  password: string;
  role: string;
  studentId?: string;
  faculty?: string;
  phone?: string;
};

export type UserUpdateInput = Partial<
  Omit<UserCreateInput, "password">
> & {
  banned?: boolean;
};

const userListSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  studentId: true,
  faculty: true,
  phone: true,
  image: true,
  banned: true,
  createdAt: true,
};

export async function listUsers(role: string, params: {
  page?: number;
  limit?: number;
  q?: string;
}) {
  const page = Math.max(params.page || 1, 1);
  const limit = Math.min(params.limit || 20, 100);
  const skip = (page - 1) * limit;

  const where: any = { role };
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { email: { contains: params.q, mode: "insensitive" } },
      ...(role === "STUDENT"
        ? [{ studentId: { contains: params.q, mode: "insensitive" } }]
        : []),
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: userListSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createUser(input: UserCreateInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (existing) throw validation("Email already in use");

  if (input.role === "STUDENT" && input.studentId) {
    const existingStudentId = await prisma.user.findUnique({
      where: { studentId: input.studentId },
    });
    if (existingStudentId) throw validation("Student ID already in use");
  }

  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session?.user) throw validation("Unauthorized");

  const created = await auth.api.createUser({
    body: {
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role as any,
      data: {
        studentId: input.studentId,
        faculty: input.faculty,
        phone: input.phone,
        emailVerified: true,
      },
    },
  });

  try { getIO()?.emit("user:changed", created.user); } catch {}

  return created.user;
}

export async function updateUser(id: string, input: UserUpdateInput) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw notFound("User");

  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.email !== undefined) data.email = input.email;
  if (input.role !== undefined) data.role = input.role;
  if (input.studentId !== undefined) data.studentId = input.studentId;
  if (input.faculty !== undefined) data.faculty = input.faculty;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.banned !== undefined) data.banned = input.banned;

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: userListSelect,
  });
  try { getIO()?.emit("user:changed", updated); } catch {}
  return updated;
}

export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw notFound("User");

  await prisma.user.delete({ where: { id } });
  try { getIO()?.emit("user:changed", { id, deleted: true }); } catch {}
}

export async function bulkCreateUsers(
  users: UserCreateInput[],
): Promise<{ created: number; errors: string[] }> {
  let created = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      await createUser(user);
      created++;
    } catch (e: any) {
      errors.push(`${user.email}: ${e.message}`);
    }
  }

  return { created, errors };
}

export async function banUser(userId: string, banned: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound("User");

  const result = await prisma.user.update({
    where: { id: userId },
    data: { banned },
    select: userListSelect,
  });
  try { getIO()?.emit(banned ? "user:banned" : "user:changed", result); } catch {}
  return result;
}
