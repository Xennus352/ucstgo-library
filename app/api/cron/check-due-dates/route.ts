import { NextRequest, NextResponse } from "next/server";
import { toNextResponse } from "@/lib/errors";
import { processOverdueNotifications } from "@/lib/services/borrow.service";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await processOverdueNotifications();
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return toNextResponse(error);
  }
}
