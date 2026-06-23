import { NextResponse } from "next/server";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ReservationStatus } from "@/app/generated/prisma/enums";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: reservationId } = await params;
    const userId = session.user.id;

    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 },
      );
    }

    // Students can only cancel their own. Admins/Librarians can cancel anyone's.
    const isStaff =
      session.user.role === "ADMIN" || session.user.role === "LIBRARIAN";
    if (reservation.userId !== userId && !isStaff) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (reservation.status !== ReservationStatus.ACTIVE) {
      return NextResponse.json(
        { success: false, error: "Only active reservations can be cancelled" },
        { status: 400 },
      );
    }

    const updated = await prisma.reservation.update({
      where: { id: reservationId },
      data: { status: ReservationStatus.CANCELLED },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Reservation cancelled successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Cancellation failed" },
      { status: 500 },
    );
  }
}
