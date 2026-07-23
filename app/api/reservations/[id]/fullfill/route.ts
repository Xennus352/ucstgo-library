import { NextResponse } from "next/server";
import { toNextResponse } from "@/lib/errors";
import { requireRole, ALLOWED_STAFF_ROLES } from "@/lib/services/auth.service";
import { fulfillReservation } from "@/lib/services/borrow.service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole(req.headers, ALLOWED_STAFF_ROLES);
    const { id: reservationId } = await params;

    const result = await fulfillReservation(reservationId);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Reservation successfully fulfilled! Borrow record created.",
    });
  } catch (error: any) {
    return toNextResponse(error);
  }
}
