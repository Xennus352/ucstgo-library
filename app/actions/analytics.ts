"use server";

import prisma from "@/lib/prisma";

export async function getTopBorrowedBooks() {
  try {
    // Group borrow records by book ID through the BookCopy relation
    const borrowCounts = await prisma.borrowRecord.groupBy({
      by: ["copyId"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    // Resolve the copy IDs to actual Book details
    const topBooks = await Promise.all(
      borrowCounts.map(async (record) => {
        const copy = await prisma.bookCopy.findUnique({
          where: { id: record.copyId },
          include: { book: true },
        });
        return {
          id: copy?.book.id || "unknown",
          title: copy?.book.title || "Unknown Title",
          isbn: copy?.book.isbn || "N/A",
          borrowCount: record._count.id,
        };
      }),
    );

    return { success: true, data: topBooks };
  } catch (error: any) {
    console.error("Failed to fetch book analytics:", error);
    return {
      success: false,
      error: "Could not aggregate book analytics data.",
    };
  }
}

export async function getTopBorrowers() {
  try {
    // Group borrow records by user ID
    const borrowerCounts = await prisma.borrowRecord.groupBy({
      by: ["userId"],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    // Resolve user IDs to explicit profiles
    const topUsers = await Promise.all(
      borrowerCounts.map(async (record) => {
        const user = await prisma.user.findUnique({
          where: { id: record.userId },
        });
        return {
          id: user?.id || "unknown",
          name: user?.name || "Unknown Student",
          email: user?.email || "N/A",
          role: user?.role || "STUDENT",
          borrowCount: record._count.id,
        };
      }),
    );

    return { success: true, data: topUsers };
  } catch (error: any) {
    console.error("Failed to fetch borrower analytics:", error);
    return {
      success: false,
      error: "Could not aggregate user analytics data.",
    };
  }
}
