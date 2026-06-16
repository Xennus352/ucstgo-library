"use server";

import prisma from "@/lib/prisma";
import dayjs from "dayjs";

export async function getLibraryStats() {
  try {
    const now = new Date();
    const currentMonthStart = dayjs(now).startOf("month").toDate();

    // 1. Total Books & This Month's Additions
    const [totalBooks, booksThisMonth] = await Promise.all([
      prisma.book.count(),
      prisma.book.count({
        where: { createdAt: { gte: currentMonthStart } },
      }),
    ]);

    // 2. Total Registered Authors
    const totalAuthors = await prisma.author.count();

    // 3. Available Copies & Currently Borrowed Count
    const [availableCopies, currentlyBorrowed] = await Promise.all([
      prisma.bookCopy.count({
        where: { status: "AVAILABLE" },
      }),
      prisma.bookCopy.count({
        where: { status: "BORROWED" },
      }),
    ]);

    // 4. Categories Count
    const totalCategories = await prisma.category.count();

    return {
      success: true,
      data: {
        totalBooks: totalBooks.toLocaleString(),
        booksThisMonthTrend: `+${booksThisMonth} this month`,
        totalAuthors: totalAuthors.toLocaleString(),
        genreTrend: `Across ${totalCategories} separate categories`,
        availableCopies: availableCopies.toLocaleString(),
        currentlyBorrowedTrend: `${currentlyBorrowed} items currently out on loan`,
        totalCategories: totalCategories.toLocaleString(),
      },
    };
  } catch (error) {
    console.error("Failed to fetch library stats:", error);
    return {
      success: false,
      error: "Could not load library metrics.",
    };
  }
}
