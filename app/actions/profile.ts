"use server";

import prisma from "@/lib/prisma";
import { logActionIssue } from "@/lib/log-error";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getUserProfileData() {
  try {
    // 1. Authenticate the active user session securely
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Authentication required." };
    }

    const userId = session.user.id;

    // 2. Fetch records concurrently using Promise.all
    const [borrowRecords, reservations] = await Promise.all([
      prisma.borrowRecord.findMany({
        where: { userId },
        include: {
          copy: {
            include: {
              book: {
                include: { author: true, category: true },
              },
            },
          },
        },
        orderBy: { borrowDate: "desc" },
      }),

      prisma.reservation.findMany({
        where: { userId },
        include: {
          book: {
            include: {
              copies: true, 
              author: true,
              category: true,
            },
          },
        },
        orderBy: { reservedAt: "desc" },
      }),
    ]);

    return {
      success: true,
      data: { borrowRecords, reservations },
    };
  } catch (error: any) {
    void logActionIssue(
      "getUserProfileData",
      `Failed to load profile details: ${error?.message || "unknown error"}`,
      { severity: "error", stack: error?.stack ?? null },
    );
    return {
      success: false,
      error: error.message || "Failed to load profile details.",
    };
  }
}

export async function getStudentReadingStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return { success: false, error: "Authentication required." };
    }

    const userId = session.user.id;

    const [studentCount, allCounts, totalUnique] = await Promise.all([
      prisma.borrowRecord.count({ where: { userId } }),
      prisma.borrowRecord.count(),
      prisma.borrowRecord.groupBy({
        by: ["userId"],
        _count: { id: true },
      }),
    ]);

    const sortedCounts = allCounts > 0
      ? totalUnique.map((u) => u._count.id).sort((a, b) => b - a)
      : [];

    let rank = 1;
    for (const c of sortedCounts) {
      if (c <= studentCount) break;
      rank++;
    }

    const totalBorrowers = totalUnique.length;
    const percentile = totalBorrowers > 0
      ? Math.round(((totalBorrowers - rank) / totalBorrowers) * 100)
      : 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyBorrowed = await prisma.borrowRecord.count({
      where: { userId, borrowDate: { gte: startOfMonth } },
    });

    return {
      success: true,
      data: {
        totalBorrowed: studentCount,
        totalBorrowsInSystem: allCounts,
        totalBorrowers,
        rank,
        percentile,
        monthlyBorrowed,
      },
    };
  } catch (error: any) {
    void logActionIssue(
      "getStudentReadingStats",
      `Failed to load reading stats: ${error?.message || "unknown error"}`,
      { severity: "error", stack: error?.stack ?? null },
    );
    return {
      success: false,
      error: error.message || "Failed to load reading stats.",
    };
  }
}
