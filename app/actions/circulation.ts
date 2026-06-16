"use server";

import prisma from "@/lib/prisma";

export async function getLiveCirculationData() {
  try {
    const records = await prisma.borrowRecord.findMany({
      orderBy: {
        borrowDate: "desc",
      },
      take: 10, // Limits the dashboard viewport payload size
      include: {
        user: {
          select: {
            name: true,
            role: true,
          },
        },
        copy: {
          include: {
            book: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    // Remap your DB relations into your flat DataTable UI structure
    const formattedData = records.map((record) => ({
      id: record.id.slice(0, 8).toUpperCase(), // Clean short id string variant (e.g., "TX-9021")
      borrower: record.user.name,
      role:
        record.user.role.charAt(0) + record.user.role.slice(1).toLowerCase(), // Formats 'STUDENT' to 'Student'
      bookTitle: record.copy.book.title,
      status: record.status.charAt(0) + record.status.slice(1).toLowerCase(), // Formats 'BORROWED' to 'Borrowed'
      date: record.borrowDate.toISOString().split("T")[0],
      dueDate: record.dueDate.toISOString().split("T")[0],
    }));

    return { success: true, data: formattedData };
  } catch (error) {
    console.error("Dashboard table retrieval error:", error);
    return { success: false, error: "Failed to parse system logs." };
  }
}
