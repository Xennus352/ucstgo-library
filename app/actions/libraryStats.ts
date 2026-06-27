"use server";

import prisma from "@/lib/prisma";



export interface LibraryMetrics {
  totalBooks: number;
  students: number;
  totalCategories: number;
  totalAuthors: number;
}

export async function getLibraryDashboardMetrics(): Promise<{
  success: boolean;
  data?: LibraryMetrics;
  error?: string;
}> {
  try {
    // Run all count inquiries simultaneously using parallel promises
    const [bookCount, studentCount, categoryCount, authorCount] = await prisma.$transaction([
      prisma.book.count(),
      prisma.user.count({
        where: {
          role: "STUDENT",
        },
      }),
      prisma.category.count(),
      prisma.author.count(),
    ]);

    return {
      success: true,
      data: {
        totalBooks: bookCount,
        students: studentCount,
        totalCategories: categoryCount,
        totalAuthors: authorCount,
      },
    };
  } catch (error: any) {
    console.error("Database server action failed to aggregate library stats:", error);
    return {
      success: false,
      error: "Failed to collect real-time database metric summaries.",
    };
  }
}