"use server";

import  prisma  from "@/lib/prisma";
import dayjs from "dayjs";

export async function getSectionCardStats() {
  try {
    const now = new Date();
    const startOfCurrentMonth = dayjs(now).startOf("month").toDate();

    const [
      totalBooks,
      newBooksThisMonth,
      activeBorrowersCount,
      totalUsersCount,
      totalCopies, // Changed from booksIssued
      overdueItems,
    ] = await Promise.all([
      // 1. Total Unique Titles
      prisma.book.count(),
      prisma.book.count({
        where: { createdAt: { gte: startOfCurrentMonth } },
      }),

      // 2. Active Borrowers
      prisma.user.count({
        where: {
          borrowRecords: {
            some: { status: "BORROWED" },
          },
        },
      }),
      prisma.user.count({
        where: { banned: false },
      }),

      // 3. Total Physical Copies (Every single copy in the library inventory)
      prisma.bookCopy.count(),

      // 4. Overdue Items
      prisma.borrowRecord.count({
        where: { status: "OVERDUE" },
      }),
    ]);

    const activityPercentage =
      totalUsersCount > 0
        ? Math.round((activeBorrowersCount / totalUsersCount) * 100)
        : 0;

    return {
      success: true,
      data: {
        totalBooks: totalBooks.toLocaleString(),
        newBooksLabel: `+${newBooksThisMonth} new`,
        activeBorrowers: activeBorrowersCount.toLocaleString(),
        activityRateLabel: `${activityPercentage}% active`,
        totalCopies: totalCopies.toLocaleString(), // Changed field
        overdueItems: overdueItems.toLocaleString(),
      },
    };
  } catch (error) {
    console.error("Failed to compile layout metric values:", error);
    return { success: false, error: "Database aggregate computation failure." };
  }
}
