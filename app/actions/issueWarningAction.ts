"use server";

import prisma from "@/lib/prisma";

export async function issueWarningAction(userId: string, bookTitle: string) {
  try {
    //  Write the targeted record to your Notification database table
    const notification = await prisma.notification.create({
      data: {
        userId: userId, // Targeted recipient student/lecturer's ID
        title: "⚠️ Overdue Warning Notice",
        message: `You are receiving an official warning notice for your pending loan on "${bookTitle}". Please return it to the desk layout immediately.`,
      },
    });

    //  Real-time broadcast via global Socket.io instance
    const io = (global as any).io;
    if (io) {
      // Emit exclusively to the targeted user's socket room channel
      io.to(userId).emit("new-notification", {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        createdAt: notification.createdAt.toISOString(),
        isRead: false,
      });
    }

    return { success: true, message: "Warning sent over live channels." };
  } catch (error: any) {
    console.error("Notification pipeline break:", error);
    return { success: false, error: "Failed to dispatch system alerts." };
  }
}
