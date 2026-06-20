"use server";

import prisma from "@/lib/prisma";
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
    return {
      success: false,
      error: error.message || "Failed to load profile details.",
    };
  }
}
