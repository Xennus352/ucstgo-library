import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ReservationStatus, CopyStatus } from "@/app/generated/prisma/enums";

export async function POST(req: Request) {
  try {
    // 1. Properly pass the Next.js runtime headers into Better-Auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const userId = session.user.id;

    // 2. Extract and validate incoming payload
    const { bookId } = await req.json();
    if (!bookId) {
      return NextResponse.json(
        { success: false, error: "Missing book identifier" },
        { status: 400 },
      );
    }

    // 3. Run transactional isolation checks
    const result = await prisma.$transaction(async (tx) => {
      // Rule A: Don't allow reservations if a physical copy is available right now
      const availableCopy = await tx.bookCopy.findFirst({
        where: { bookId, status: CopyStatus.AVAILABLE },
      });

      if (availableCopy) {
        throw new Error(
          "Copies are currently available on shelves. Please borrow directly instead.",
        );
      }

      // Rule B: Don't allow double queuing for the same book
      const existingHold = await tx.reservation.findFirst({
        where: { userId, bookId, status: ReservationStatus.PENDING },
      });

      if (existingHold) {
        throw new Error(
          "You already have an active reservation queue spot for this book.",
        );
      }

      // Rule C: Safely create the pending queue position
      return await tx.reservation.create({
        data: { userId, bookId, status: ReservationStatus.PENDING },
      });
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal booking loop crash" },
      { status: 400 },
    );
  }
}
