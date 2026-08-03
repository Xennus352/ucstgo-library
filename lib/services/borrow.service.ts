import prisma from "@/lib/prisma";
import { notFound, validation } from "@/lib/errors";
import { getIO } from "@/lib/socket";

export type ReservationQueryParams = {
  page?: number;
  limit?: number;
};

export async function listReservations(
  userId: string,
  userRole: string,
  params: ReservationQueryParams = {},
) {
  const page = Math.max(params.page || 1, 1);
  const limit = Math.min(params.limit || 10, 50);
  const skip = (page - 1) * limit;
  const isPrivileged = userRole === "ADMIN" || userRole === "LIBRARIAN";

  const where: any = {
    status: { in: ["ACTIVE", "FULFILLED", "EXPIRED"] as const },
    ...(isPrivileged ? {} : { userId }),
  };

  const [reservations, total] = await prisma.$transaction([
    prisma.reservation.findMany({
      where,
      orderBy: { reservedAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        status: true,
        reservedAt: true,
        expiresAt: true,
        user: {
          select: { id: true, name: true, email: true, studentId: true },
        },
        book: {
          select: {
            id: true,
            title: true,
            coverImage: true,
            author: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
    }),
    prisma.reservation.count({ where }),
  ]);

  return {
    data: reservations,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function createReservation(
  bookId: string,
  userId: string,
) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) throw notFound("Book");

  const existingReservation = await prisma.reservation.findFirst({
    where: {
      userId,
      bookId,
      status: { in: ["ACTIVE", "FULFILLED"] as const },
    },
  });
  if (existingReservation) {
    throw validation(
      "You already have an active or fulfilled reservation for this book.",
    );
  }

  const availableCopy = await prisma.bookCopy.findFirst({
    where: { bookId, status: "AVAILABLE" },
  });

  if (availableCopy) {
    return {
      status: "COPY_AVAILABLE" as const,
      message: "Copies are currently available. Please borrow directly instead.",
    };
  }

  const activeBorrow = await prisma.borrowRecord.findFirst({
    where: {
      copy: { bookId },
      status: { in: ["BORROWED", "OVERDUE"] as const },
      returnDate: null,
    },
    orderBy: { dueDate: "asc" },
  });

  let calculatedExpiry: Date;
  if (activeBorrow) {
    calculatedExpiry = new Date(activeBorrow.dueDate);
    calculatedExpiry.setDate(calculatedExpiry.getDate() + 1);
  } else {
    calculatedExpiry = new Date();
    calculatedExpiry.setDate(calculatedExpiry.getDate() + 7);
  }

  const reservation = await prisma.reservation.create({
    data: { userId, bookId, status: "ACTIVE", expiresAt: calculatedExpiry },
    include: {
      book: { include: { author: true, category: true } },
    },
  });

  try { getIO()?.emit("reservation:created", reservation); } catch {}

  return { status: "RESERVED" as const, reservation };
}

export async function cancelReservation(
  reservationId: string,
  userId: string,
  userRole: string,
) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
  });
  if (!reservation) throw notFound("Reservation");

  const isStaff = userRole === "ADMIN" || userRole === "LIBRARIAN";
  if (reservation.userId !== userId && !isStaff) {
    throw validation("Forbidden");
  }

  if (reservation.status !== "ACTIVE") {
    throw validation("Only active reservations can be cancelled");
  }

  const cancelled = await prisma.reservation.update({
    where: { id: reservationId },
    data: { status: "CANCELLED" },
  });
  try { getIO()?.emit("reservation:status", cancelled); } catch {}
  return cancelled;
}

export async function fulfillReservation(reservationId: string) {
  return prisma.$transaction(async (tx: any) => {
    const reservation = await tx.reservation.findUnique({
      where: { id: reservationId },
    });
    if (!reservation) throw notFound("Reservation");
    if (reservation.status !== "ACTIVE") {
      throw validation("Reservation is not active or already fulfilled");
    }

    const copy = await tx.bookCopy.findFirst({
      where: { bookId: reservation.bookId, status: "AVAILABLE" },
    });
    if (!copy) throw validation("No available copies to fulfill this request");

    await tx.bookCopy.update({
      where: { id: copy.id },
      data: { status: "BORROWED" },
    });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const borrowRecord = await tx.borrowRecord.create({
      data: {
        userId: reservation.userId,
        copyId: copy.id,
        status: "BORROWED",
        dueDate,
      },
    });

    await tx.reservation.update({
      where: { id: reservationId },
      data: { status: "FULFILLED" },
    });

    try { getIO()?.emit("reservation:status", { reservationId, status: "FULFILLED" }); } catch {}
    try { getIO()?.emit("borrow:created", borrowRecord); } catch {}

    return { borrowRecord };
  });
}

export async function processOverdueNotifications() {
  const now = new Date();
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(now.getDate() + 2);
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

  const overdueRecords = await prisma.borrowRecord.findMany({
    where: { dueDate: { lt: now }, status: "BORROWED" },
    include: { copy: { include: { book: true } } },
  });

  for (const record of overdueRecords) {
    await prisma.$transaction([
      prisma.borrowRecord.update({
        where: { id: record.id },
        data: { status: "OVERDUE" },
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

  const nearDueRecords = await prisma.borrowRecord.findMany({
    where: {
      dueDate: { gt: now, lt: twoDaysFromNow },
      status: "BORROWED",
    },
    include: { copy: { include: { book: true } } },
  });

  const notificationsSentToday = await prisma.notification.findMany({
    where: {
      createdAt: { gte: startOfToday },
      title: { startsWith: "Upcoming Book Due Date" },
    },
    select: { userId: true, message: true },
  });

  let alertsSent = 0;
  for (const record of nearDueRecords) {
    const bookTitle = record.copy.book.title;
    const expectedMessage = `Your copy of "${bookTitle}" is due within the next 48 hours.`;

    const alreadyAlerted = notificationsSentToday.some(
      (n: any) => n.userId === record.userId && n.message === expectedMessage,
    );
    if (!alreadyAlerted) {
      await prisma.notification.create({
        data: {
          userId: record.userId,
          title: "Upcoming Book Due Date ⏰",
          message: expectedMessage,
        },
      });
      alertsSent++;
    }
  }

  return { overdueProcessed: overdueRecords.length, alertsSent };
}
