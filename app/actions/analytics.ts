"use server";

import prisma from "@/lib/prisma";
import { logActionIssue } from "@/lib/log-error";

export async function getTopBorrowedBooks() {
  try {
    const rows = await prisma.borrowRecord.findMany({
      select: {
        copy: {
          select: { bookId: true },
        },
      },
    });

    const countMap = new Map<string, number>();
    for (const row of rows) {
      const bookId = row.copy?.bookId;
      if (bookId) countMap.set(bookId, (countMap.get(bookId) || 0) + 1);
    }

    const sorted = [...countMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topBooks = await Promise.all(
      sorted.map(async ([bookId, count]) => {
        const book = await prisma.book.findUnique({
          where: { id: bookId },
          select: { id: true, title: true, category: { select: { name: true } } },
        });
        return {
          id: book?.id || bookId,
          title: book?.title || "Unknown Title",
          categoryName: book?.category?.name || "Uncategorized",
          borrowCount: count,
        };
      }),
    );

    return { success: true, data: topBooks };
  } catch (error: any) {
    console.error("Failed to fetch book analytics:", error);
    void logActionIssue(
      "bookAnalytics",
      `Book analytics aggregation failed: ${error?.message || "unknown error"}`,
      { severity: "error", stack: error?.stack ?? null },
    );
    return {
      success: false,
      error: "Could not aggregate book analytics data.",
    };
  }
}

export async function getTopBorrowers() {
  try {
    const borrowerCounts = await prisma.borrowRecord.groupBy({
      by: ["userId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    });

    const topUsers = await Promise.all(
      borrowerCounts.map(async (record) => {
        const user = await prisma.user.findUnique({
          where: { id: record.userId },
          select: { id: true, name: true, email: true, role: true },
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
    void logActionIssue(
      "borrowerAnalytics",
      `Borrower analytics aggregation failed: ${error?.message || "unknown error"}`,
      { severity: "error", stack: error?.stack ?? null },
    );
    return {
      success: false,
      error: "Could not aggregate user analytics data.",
    };
  }
}
