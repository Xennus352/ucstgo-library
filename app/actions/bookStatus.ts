"use server";

import prisma from "@/lib/prisma";
import dayjs from "dayjs";

export async function getLibraryStats() {
  try {
    const currentMonthStart = dayjs().startOf("month").toDate();

    const [
      totalBooks,
      booksThisMonth,
      totalAuthors,
      availableCopies,
      currentlyBorrowed,
      totalCategories,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.book.count({ where: { createdAt: { gte: currentMonthStart } } }),
      prisma.author.count(),
      prisma.bookCopy.count({ where: { status: "AVAILABLE" } }),
      prisma.bookCopy.count({ where: { status: "BORROWED" } }),
      prisma.category.count(),
    ]);

    return {
      success: true,
      data: {
        totalBooks,
        booksThisMonth,
        totalAuthors,
        availableCopies,
        currentlyBorrowed,
        totalCategories,
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
