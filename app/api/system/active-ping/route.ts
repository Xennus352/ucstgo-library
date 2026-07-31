import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toNextResponse } from "@/lib/errors";
import { requireSession } from "@/lib/services/auth.service";

export async function POST(req: Request) {
  try {
    const { user } = await requireSession(req.headers);
    const body = await req.json().catch(() => null);
    const path =
      typeof body?.path === "string" ? body.path.slice(0, 300) : "/";

    await prisma.activeUser.upsert({
      where: { userId: user.id },
      update: {
        name: user.name,
        email: user.email ?? null,
        studentId: (user as { studentId?: string | null }).studentId ?? null,
        role: user.role,
        path,
        lastSeenAt: new Date(),
      },
      create: {
        userId: user.id,
        name: user.name,
        email: user.email ?? null,
        studentId: (user as { studentId?: string | null }).studentId ?? null,
        role: user.role,
        path,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return toNextResponse(error);
  }
}
