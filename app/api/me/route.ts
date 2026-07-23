import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { toNextResponse } from "@/lib/errors";

export async function GET() {
  try {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, role: true,
        studentId: true, faculty: true, phone: true,
        createdAt: true, image: true, emailVerified: true,
        updatedAt: true, banned: true,
      },
    });

    if (!user) {
      return Response.json({ message: "User not found" }, { status: 404 });
    }

    return Response.json(user);
  } catch (error) {
    return toNextResponse(error);
  }
}
