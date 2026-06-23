import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  ReservationStatus,
  CopyStatus,
  BorrowStatus,
} from "@/app/generated/prisma/enums";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // 1. Role enforcement: Only Staff can issue/fulfill a physical book reservation
    if (
      !session?.user ||
      (session.user.role !== "ADMIN" && session.user.role !== "LIBRARIAN")
    ) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Staff clearance required." },
        { status: 403 },
      );
    }

    const { id: reservationId } = await params;

    // 2. Perform safe distribution logic inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id: reservationId },
      });

      if (!reservation) throw new Error("Reservation record not found");
      if (reservation.status !== ReservationStatus.ACTIVE) {
        throw new Error(
          "This reservation is no longer active or has already been fulfilled",
        );
      }

      // Find an available physical book copy on shelves
      const availableCopy = await tx.bookCopy.findFirst({
        where: { bookId: reservation.bookId, status: CopyStatus.AVAILABLE },
      });

      if (!availableCopy) {
        throw new Error(
          "No physical copies available right now to fulfill this request",
        );
      }

      // Update copy status to borrowed
      await tx.bookCopy.update({
        where: { id: availableCopy.id },
        data: { status: CopyStatus.BORROWED },
      });

      // Create standard borrow record tracking timeline (e.g., due in 14 days)
      const durationDays = 14;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + durationDays);

      const borrowRecord = await tx.borrowRecord.create({
        data: {
          userId: reservation.userId,
          copyId: availableCopy.id,
          status: BorrowStatus.BORROWED,
          borrowDate: new Date(),
          dueDate: dueDate,
        },
      });

      // Close out reservation window as FULFILLED
      const fulfilledReservation = await tx.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.FULFILLED },
      });

      return { fulfilledReservation, borrowRecord };
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "Reservation successfully fulfilled! Borrow record created.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Fulfillment cycle crashed" },
      { status: 400 },
    );
  }
}
