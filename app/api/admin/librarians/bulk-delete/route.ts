import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  // 1. Strict Authorization: Only Admins can perform bulk librarian purges
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { message: "Unauthorized access: Admin privilege required." }, 
      { status: 403 }
    );
  }

  try {
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Invalid payload: Missing librarian IDs." }, 
        { status: 400 }
      );
    }

    // 2. Perform transactional deletion with role-validation
    // We filter by ID and the LIBRARIAN role to ensure data integrity
    const [deletedSessions, deletedAccounts, deletedUsers] = await prisma.$transaction([
      prisma.session.deleteMany({
        where: { userId: { in: ids } },
      }),
      prisma.account.deleteMany({
  where: { userId: { in: ids } }, 
}),
      prisma.user.deleteMany({
        where: { 
          id: { in: ids },
          role: "LIBRARIAN" // Safety: Only target librarians
        },
      }),
    ]);

    return NextResponse.json({
      message: "Bulk librarian accounts purged successfully.",
      count: deletedUsers.count,
    }, { status: 200 });

  } catch (error) {
    console.error("[LIBRARIANS_SERVER_BULK_DELETE]", error);
    return NextResponse.json(
      { message: "Internal server error during bulk purge." }, 
      { status: 500 }
    );
  }
}