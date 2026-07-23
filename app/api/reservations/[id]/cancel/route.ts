import { NextResponse } from "next/server";
import { toNextResponse } from "@/lib/errors";
import { requireSession } from "@/lib/services/auth.service";
import { cancelReservation } from "@/lib/services/borrow.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user } = await requireSession(req.headers);
    const { id: reservationId } = await params;

    const updated = await cancelReservation(reservationId, user.id, user.role);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Reservation cancelled successfully",
    });
  } catch (error) {
    return toNextResponse(error);
  }
}
