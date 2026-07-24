import { NextRequest, NextResponse } from "next/server";
import  prisma  from "@/lib/prisma";
import { toNextResponse } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {

    const activeBorrows = await prisma.borrowRecord.findMany({
      where: {
        status: {
          in: ["BORROWED", "OVERDUE"],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            studentId: true,
            banned: true,
            createdAt: true,
          },
        },
        copy: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                isbn: true,
                coverImage: true,
                author: {
                  select: { name: true },
                },
                category: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    const now = new Date();

  
    const formattedData = activeBorrows.map((record) => {
      const dueDate = new Date(record.dueDate);

     
      const diffInTime = now.getTime() - dueDate.getTime();
      const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));
      const overdueDays = diffInDays > 0 ? diffInDays : 0;
      const isOverdue = diffInDays > 0;

      return {
        borrowId: record.id,
        borrowDate: record.borrowDate,
        dueDate: record.dueDate,
        status: record.status,
        isOverdue,
        overdueDays, 
        user: record.user,
        book: {
          id: record.copy.book.id,
          title: record.copy.book.title,
          isbn: record.copy.book.isbn,
          coverImage: record.copy.book.coverImage,
          author: record.copy.book.author?.name || "Unknown Author",
          category: record.copy.book.category?.name || "Uncategorized",
          barcode: record.copy.barcode,
        },
      };
    });

    return NextResponse.json({
      success: true,
      totalUnreturned: formattedData.length,
      totalOverdueCount: formattedData.filter((b) => b.isOverdue).length,
      borrows: formattedData,
    });
  } catch (error: any) {
    return toNextResponse(error);
  }
}
