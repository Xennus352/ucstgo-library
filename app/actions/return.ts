"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import {
  BorrowStatus,
  CopyStatus,
  ReservationStatus,
} from "../generated/prisma/enums";
import prisma from "@/lib/prisma";

export async function returnBookAction(borrowRecordId: string) {
  try {
    // 1. Verify that the current user is a Librarian or Admin
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Authentication required." };
    }

    const userRole = session.user.role;
    if (userRole !== "LIBRARIAN" && userRole !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized. Only librarians can process book returns.",
      };
    }

    // 2. Fetch the active borrow record (Join copy to know which Book it belongs to)
    const borrowRecord = await prisma.borrowRecord.findUnique({
      where: { id: borrowRecordId },
      include: { copy: true },
    });

    if (!borrowRecord || borrowRecord.status === BorrowStatus.RETURNED) {
      return {
        success: false,
        error: "This record is either invalid or already returned.",
      };
    }

    const bookId = borrowRecord.copy.bookId;

    // 3. Execute return updates inside a database transaction
    await prisma.$transaction(async (tx: any) => {
      // A. Update the Borrow Record status and return timestamp
      await tx.borrowRecord.update({
        where: { id: borrowRecordId },
        data: {
          status: BorrowStatus.RETURNED,
          returnDate: new Date(),
        },
      });

      // B. Check for the oldest pending reservation for this book (First Come, First Served)
      const nextReservation = await tx.reservation.findFirst({
        where: {
          bookId: bookId,
          status: ReservationStatus.ACTIVE,
        },
        orderBy: { reservedAt: "asc" },
      });

      if (nextReservation) {
        // Leave copy status as BORROWED to indicate it's not sitting freely on the shelf
        await tx.bookCopy.update({
          where: { id: borrowRecord.copyId },
          data: { status: CopyStatus.BORROWED },
        });

        // Fulfill the reservation item
        await tx.reservation.update({
          where: { id: nextReservation.id },
          data: { status: ReservationStatus.FULFILLED },
        });

        // Push an app notification to the student next in line
        await tx.notification.create({
          data: {
            userId: nextReservation.userId,
            title: "Reserved Book Available! 🎉",
            message: `The book you held is ready at the front desk. Please pick it up within 48 hours.`,
          },
        });
      } else {
        // No waiting line exists. Put it back out on the shelf safely
        await tx.bookCopy.update({
          where: { id: borrowRecord.copyId },
          data: { status: CopyStatus.AVAILABLE },
        });
      }
    });

    // 4. Clean paths cache
    revalidatePath("/librarian/books");
    revalidatePath("/admin/books");
    revalidatePath("/students/dashboard");
    revalidatePath("/lecturer/dashboard");

    return {
      success: true,
      message: "Book returned successfully and matched to queue holds!",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}
