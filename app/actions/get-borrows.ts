"use server";

import prisma from "@/lib/prisma";
import { BorrowStatus } from "../generated/prisma/enums";

export async function getAllActiveBorrows() {
  try {
    const activeBorrows = await prisma.borrowRecord.findMany({
      where: {
        status: {
          in: [BorrowStatus.BORROWED, BorrowStatus.OVERDUE],
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
    return {
      success: false,
      error: error.message || "Failed to fetch borrow entries.",
    };
  }
}
