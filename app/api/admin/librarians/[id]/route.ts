import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";


export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> } 
) {
  // Await params first
  const { id } = await props.params; 
  
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, email, phone } = await req.json();

    
    const existingLibrarian = await prisma.user.findUnique({
      where: { id }, 
    });

    if (!existingLibrarian || existingLibrarian.role !== "LIBRARIAN") {
      return NextResponse.json({ message: "Librarian not found" }, { status: 404 });
    }

    const updatedLibrarian = await prisma.user.update({
      where: { id },
      data: { name, email, phone },
    });

    return NextResponse.json({ success: true, data: updatedLibrarian }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });

  // Only ADMINs can delete Librarians
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  try {
    // 1. Verify user is a Librarian before deletion
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || targetUser.role !== "LIBRARIAN") {
      return NextResponse.json({ message: "User not found or not a librarian" }, { status: 404 });
    }

    // 2. Cascade delete linked auth records
    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.account.deleteMany({ where: { userId: id } });

    // 3. Delete user
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "Librarian deleted successfully" });
  } catch (error) {
    console.error("[LIBRARIANS_SERVER_DELETE]", error);
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}