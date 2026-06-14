import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function DELETE(req: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  // 1. Enforce strict Admin-only permissions for mass data purges
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json(
      { message: "Only root Admin profiles can drop account indices." }, 
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { ids } = body; // Expecting an array of student user IDs: ["id1", "id2", ...]

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json(
        { message: "Invalid payload formatting structure. Missing student IDs." }, 
        { status: 400 }
      );
    }

    // 2. Perform cascading deletion across tables in a single transaction block
    // Using `deleteMany` with `in: ids` handles everything instantly without slow loops!
    const [deletedSessions, deletedAccounts, deletedUsers] = await prisma.$transaction([
      prisma.session.deleteMany({
        where: { userId: { in: ids } },
      }),
      prisma.account.deleteMany({
        where: { userId: { in: ids } },
      }),
      prisma.user.deleteMany({
        where: { id: { in: ids } },
      }),
    ]);

    return Response.json({
      message: "Bulk account context completely deleted.",
      count: deletedUsers.count,
    }, { status: 200 });

  } catch (error) {
    console.error("[STUDENTS_SERVER_BULK_DELETE]", error);
    return Response.json(
      { message: "Transaction refused due to complex database dependencies." }, 
      { status: 500 }
    );
  }
}