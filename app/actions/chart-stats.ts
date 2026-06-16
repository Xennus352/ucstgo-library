"use server";

import prisma from "@/lib/prisma";
import dayjs from "dayjs";

export async function getInteractiveChartStats() {
  try {
    const totalDaysToFetch = 90;
    const now = dayjs();
    const startDate = now.subtract(totalDaysToFetch, "day").startOf("day").toDate();

    // 1. Fetch physical borrow logs for the last 90 days
    const physicalBorrows = await prisma.borrowRecord.findMany({
      where: {
        borrowDate: { gte: startDate },
      },
      select: {
        borrowDate: true,
      },
    });

    // 2. Fetch physical return logs for the last 90 days
    const physicalReturns = await prisma.borrowRecord.findMany({
      where: {
        returnDate: { gte: startDate },
      },
      select: {
        returnDate: true,
      },
    });

    // 3. Initialize an empty timeline map for physical counts
    const timelineMap: Record<string, { date: string; physical: number; returns: number }> = {};
    
    for (let i = totalDaysToFetch; i >= 0; i--) {
      const formattedDate = now.subtract(i, "day").format("YYYY-MM-DD");
      timelineMap[formattedDate] = {
        date: formattedDate,
        physical: 0,
        returns: 0,
      };
    }

    // 4. Group physical borrows counts by date string
    physicalBorrows.forEach((record) => {
      const dateStr = dayjs(record.borrowDate).format("YYYY-MM-DD");
      if (timelineMap[dateStr]) {
        timelineMap[dateStr].physical += 1;
      }
    });

    // 5. Group physical returns counts by date string
    physicalReturns.forEach((record) => {
      if (record.returnDate) {
        const dateStr = dayjs(record.returnDate).format("YYYY-MM-DD");
        if (timelineMap[dateStr]) {
          timelineMap[dateStr].returns += 1;
        }
      }
    });

    // Flatten back into a chronological array for Recharts
    const chartData = Object.values(timelineMap);

    return {
      success: true,
      data: chartData,
    };
  } catch (error) {
    console.error("Failed to generate dynamic library metrics chart data:", error);
    return { success: false, error: "Database aggregation error." };
  }
}