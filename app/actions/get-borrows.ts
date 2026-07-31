"use server";

import prisma from "@/lib/prisma";
import { logActionIssue } from "@/lib/log-error";
import { BorrowStatus } from "../generated/prisma/enums";

export async function getAllBorrows() {
  try {
    const activeBorrows = await prisma.borrowRecord.findMany({
      where: {
        status: {
          in: [BorrowStatus.BORROWED, BorrowStatus.OVERDUE, BorrowStatus.RETURNED],
        },
      },
      include: {
        // Fetch full information about the user who borrowed the book
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            studentId: true,
            faculty: true,
            phone: true,
            role: true,
          },
        },
        // Step through the copy to find its parent book core info
        copy: {
          include: {
            book: {
              include: {
                author: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: "asc", // Keeps overdue and near-due books at the very top
      },
    });

    return { success: true, data: activeBorrows };
  } catch (error: any) {
    void logActionIssue(
      "getBorrows",
      `Failed to fetch borrow entries: ${error?.message || "unknown error"}`,
      { severity: "error", stack: error?.stack ?? null },
    );
    return {
      success: false,
      error: error.message || "Failed to fetch borrow entries.",
    };
  }
}
