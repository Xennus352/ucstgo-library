"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth"; 
import { BorrowStatus, CopyStatus } from "../generated/prisma/enums";
import prisma from "@/lib/prisma";

// Notice we REMOVED userId from the parameters entirely!
export async function borrowBookAction(bookId: string) {
  try {
    // 1. Resolve the logged-in user on the server securely
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return {
        success: false,
        error: "Authentication required. Please log in to borrow books.",
      };
    }

    const userId = session.user.id;

    // 2. Check user's current active borrow count
    const activeBorrowsCount = await prisma.borrowRecord.count({
      where: {
        userId: userId,
        status: {
          in: [BorrowStatus.BORROWED, BorrowStatus.OVERDUE],
        },
      },
    });

    if (activeBorrowsCount >= 2) {
      return {
        success: false,
        error: "Limit reached. You can only borrow up to 2 books at a time.",
      };
    }

    // 3. Locate an available physical copy
    const availableCopy = await prisma.bookCopy.findFirst({
      where: {
        bookId: bookId,
        status: CopyStatus.AVAILABLE,
      },
    });

    if (!availableCopy) {
      return {
        success: false,
        error:
          "Sorry, all physical copies of this book are currently checked out.",
      };
    }

    // Calculate due date (Exactly 14 days from right now)
    const TWO_WEEKS_IN_MS = 14 * 24 * 60 * 60 * 1000;
    const dueDate = new Date(Date.now() + TWO_WEEKS_IN_MS);

    // 4. Execute database mutation inside an ACID transaction
    await prisma.$transaction(async (tx: any) => {
      const finalCheck = await tx.bookCopy.findUnique({
        where: { id: availableCopy.id },
      });

      if (!finalCheck || finalCheck.status !== CopyStatus.AVAILABLE) {
        throw new Error("Copy was caught by another user. Please try again.");
      }

      // Create tracking history row
      await tx.borrowRecord.create({
        data: {
          userId: userId,
          copyId: finalCheck.id,
          dueDate: dueDate,
          status: BorrowStatus.BORROWED,
        },
      });

      // Update copy availability state
      await tx.bookCopy.update({
        where: { id: finalCheck.id },
        data: { status: CopyStatus.BORROWED },
      });
    });

    revalidatePath("/student/dashboard");
    revalidatePath("/teacher/dashboard");
    
    return {
      success: true,
      message: "Book successfully borrowed! Enjoy your reading.",
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
    };
  }
}
