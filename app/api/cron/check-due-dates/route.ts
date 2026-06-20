import { BorrowStatus } from "@/app/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";



export async function GET(request: NextRequest) {
  // Optional security: Secure your cron route using an environment token secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(now.getDate() + 2);

  try {
    // --- TASK A: CONVERT EXPIRED BORROWS TO OVERDUE AND ALERT ---
    const overdueRecords = await prisma.borrowRecord.findMany({
      where: {
        dueDate: { lt: now },
        status: BorrowStatus.BORROWED,
      },
    });

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
            message: "An item you borrowed has passed its due date. Return it immediately to avoid fines.",
          },
        }),
      ]);
    }

    // --- TASK B: ALERT BOOKS DUE IN 2 DAYS ---
    const nearDueRecords = await prisma.borrowRecord.findMany({
      where: {
        dueDate: { gt: now, lt: twoDaysFromNow },
        status: BorrowStatus.BORROWED,
      },
    });

    for (const record of nearDueRecords) {
      // Check if alert was already dispatched today to prevent spam
      const alreadyAlerted = await prisma.notification.findFirst({
        where: {
          userId: record.userId,
          createdAt: { gte: new Date(new Date().setHours(0,0,0,0)) },
          title: "Upcoming Book Due Date ⏰",
        },
      });

      if (!alreadyAlerted) {
        await prisma.notification.create({
          data: {
            userId: record.userId,
            title: "Upcoming Book Due Date ⏰",
            message: "You have a book copy due within the next 48 hours.",
          },
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      overdueProcessed: overdueRecords.length, 
      alertsSent: nearDueRecords.length 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}