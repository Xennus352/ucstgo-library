import { NextResponse } from "next/server";
import { toNextResponse } from "@/lib/errors";
import { requireSession } from "@/lib/services/auth.service";
import { listReservations } from "@/lib/services/borrow.service";

export async function GET(req: Request) {
  try {
    const { user } = await requireSession(req.headers);
    const { searchParams } = new URL(req.url);

    const result = await listReservations(user.id, user.role, {
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "10", 10),
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return toNextResponse(error);
  }
}
