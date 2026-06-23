import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  ReservationStatus,
  CopyStatus,
  BorrowStatus,
} from "@/app/generated/prisma/enums";

export async function POST(req: Request) {
  try {
    // 1. Authenticate session with Next.js headers runtime
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const userId = session.user.id;

    // 2. Parse payload identifier
    const { bookId } = await req.json();
    if (!bookId) {
      return NextResponse.json(
        { success: false, error: "Missing book identifier" },
        { status: 400 },
      );
    }

    // 3. Process database conditions inside an isolated interactive transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check for any duplicate unresolved reservations by this user
      const existingReservation = await tx.reservation.findFirst({
        where: {
          userId,
          bookId,
          status: {
            in: [ReservationStatus.ACTIVE, ReservationStatus.FULFILLED],
          },
        },
      });

      if (existingReservation) {
        throw new Error(
          "You already have an active or fulfilled reservation for this book.",
        );
      }

      // Check if any copy is physically sitting on shelves ready to take out
      const availableCopy = await tx.bookCopy.findFirst({
        where: { bookId, status: CopyStatus.AVAILABLE },
        include: { book: true },
      });

      if (availableCopy) {
        return {
          status: "COPY_AVAILABLE" as const, // Added 'as const' to fix type narrowing
          message:
            "Copies are currently available. Please borrow directly instead.",
          availableCopy,
        };
      }

      // --- DYNAMIC EXPIRATION LOGIC (CHANGED) ---
      // Query active checkout timelines for copies of this specific book
      const activeBorrowRecord = await tx.borrowRecord.findFirst({
        where: {
          copy: { bookId: bookId },
          status: {
            in: [BorrowStatus.BORROWED, BorrowStatus.OVERDUE],
          },
          returnDate: null, // Filter out already returned histories
        },
        orderBy: {
          dueDate: "asc", // Sort so the copy returning earliest comes first
        },
      });

      let calculatedExpiry: Date;

      if (activeBorrowRecord) {
        // Expiration is exactly 1 day after the expected due date
        calculatedExpiry = new Date(activeBorrowRecord.dueDate);
        calculatedExpiry.setDate(calculatedExpiry.getDate() + 1);
      } else {
        // Fallback safety threshold if copies are flagged LOST or DAMAGED but not checked out
        const staticFallbackDays = 7;
        calculatedExpiry = new Date();
        calculatedExpiry.setDate(
          calculatedExpiry.getDate() + staticFallbackDays,
        );
      }
      // --- END DYNAMIC EXPIRATION LOGIC ---

      // Create the pending queue registration
      const reservation = await tx.reservation.create({
        data: {
          userId,
          bookId,
          status: ReservationStatus.ACTIVE,
          reservedAt: new Date(),
          expiresAt: calculatedExpiry,
        },
        include: {
          book: {
            include: {
              author: true,
              category: true,
            },
          },
        },
      });

      return {
        status: "RESERVED" as const, // Added 'as const' to fix type narrowing
        reservation,
      };
    });

    // 4. Evaluate transactional processing pathways
    if (result.status === "COPY_AVAILABLE") {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          code: "COPY_AVAILABLE",
          availableCopy: result.availableCopy,
        },
        { status: 409 },
      );
    }

    // TypeScript now knows result.reservation is safe here because of 'as const' above
    const expiryString = result.reservation.expiresAt
      ? result.reservation.expiresAt.toLocaleDateString()
      : "the scheduled return date";

    return NextResponse.json({
      success: true,
      data: result.reservation,
      message: `Book reserved successfully! This reservation will hold until ${expiryString}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal system process failure",
        code: error.code || "UNKNOWN_ERROR",
      },
      { status: 400 },
    );
  }
}
