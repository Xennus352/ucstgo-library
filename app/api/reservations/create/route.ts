import { NextResponse } from "next/server";
import { toNextResponse } from "@/lib/errors";
import { requireSession } from "@/lib/services/auth.service";
import { createReservation } from "@/lib/services/borrow.service";

export async function POST(req: Request) {
  try {
    const { user } = await requireSession(req.headers);
    const { bookId } = await req.json();
    if (!bookId) {
      return NextResponse.json(
        { success: false, error: "Missing book identifier" },
        { status: 400 },
      );
    }

    const result = await createReservation(bookId, user.id);

    if (result.status === "COPY_AVAILABLE") {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          code: "COPY_AVAILABLE",
        },
        { status: 409 },
      );
    }

    const expiryString = result.reservation.expiresAt
      ? result.reservation.expiresAt.toLocaleDateString()
      : "the scheduled return date";

    return NextResponse.json({
      success: true,
      data: result.reservation,
      message: `Book reserved successfully! This reservation will hold until ${expiryString}.`,
    });
  } catch (error: any) {
    return toNextResponse(error);
  }
}
