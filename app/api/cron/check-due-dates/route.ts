import { BorrowStatus } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 1. Secure your cron route using an environment token secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(now.getDate() + 2);
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

  try {
    // ========================================================
    // TASK A: CONVERT EXPIRED BORROWS TO OVERDUE & ALERT
    // ========================================================
    const overdueRecords = await prisma.borrowRecord.findMany({
      where: {
        dueDate: { lt: now },
        status: BorrowStatus.BORROWED,
      },
      include: {
        copy: { include: { book: true } }, // Fetching book title for better notifications
      },
    });

    // Execute in a single sequential batch or chunked transactions if data is large
    for (const record of overdueRecords) {
      await prisma.$transaction([
        prisma.borrowRecord.update({
          where: { id: record.id },
          data: { status: BorrowStatus.OVERDUE },
        }),
        prisma.notification.create({
          data: {
            userId: record.userId,
            title: "Book Overdue Warning! 🚨",
            message: `The book "${record.copy.book.title}" has passed its due date. Return it immediately to avoid fines.`,
          },
        }),
      ]);
    }

    // ========================================================
    // TASK B: ALERT BOOKS DUE IN 2 DAYS (Optimized & Bug-Fixed)
    // ========================================================
    const nearDueRecords = await prisma.borrowRecord.findMany({
      where: {
        dueDate: { gt: now, lt: twoDaysFromNow },
        status: BorrowStatus.BORROWED,
      },
      include: {
        copy: { include: { book: true } },
      },
    });

    // To prevent N+1 queries, pull all notifications sent today by this title format
    const notificationsSentToday = await prisma.notification.findMany({
      where: {
        createdAt: { gte: startOfToday },
        title: { startsWith: "Upcoming Book Due Date" },
      },
      select: { userId: true, message: true },
    });

    let alertsSentCounter = 0;

    for (const record of nearDueRecords) {
      const bookTitle = record.copy.book.title;
      const expectedMessage = `Your copy of "${bookTitle}" is due within the next 48 hours.`;

      // Check cache/array instead of hitting the DB again
      const alreadyAlerted = notificationsSentToday.some(
        (n) => n.userId === record.userId && n.message === expectedMessage,
      );

      if (!alreadyAlerted) {
        await prisma.notification.create({
          data: {
            userId: record.userId,
            title: `Upcoming Book Due Date ⏰`,
            message: expectedMessage,
          },
        });
        alertsSentCounter++;
      }
    }

    return NextResponse.json({
      success: true,
      overdueProcessed: overdueRecords.length,
      alertsSent: alertsSentCounter,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
