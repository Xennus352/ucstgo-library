import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toNextResponse, validation } from "@/lib/errors";
import { requireRole, ALLOWED_ADMIN_ROLES } from "@/lib/services/auth.service";
import { refreshBlockedIps } from "@/lib/monitor";

export async function GET(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);
    const { searchParams } = new URL(req.url);
    const page = Math.max(Number(searchParams.get("page")) || 1, 1);
    const limit = Math.max(Number(searchParams.get("limit")) || 15, 1);
    const eventType = searchParams.get("type")?.trim();
    const skip = (page - 1) * limit;

    const where = eventType ? { eventType } : {};

    const [events, total] = await Promise.all([
      prisma.securityEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.securityEvent.count({ where }),
    ]);

    return NextResponse.json({
      data: events,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return toNextResponse(error);
  }
}

export async function PATCH(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);
    const { ip, blocked, reason } = await req.json();

    if (!ip || typeof ip !== "string" || !ip.trim()) {
      throw validation("IP address is required");
    }

    if (blocked) {
      await prisma.blockedIp.upsert({
        where: { ip: ip.trim() },
        update: { reason: reason?.trim() || null },
        create: { ip: ip.trim(), reason: reason?.trim() || null },
      });
    } else {
      await prisma.blockedIp.deleteMany({ where: { ip: ip.trim() } });
    }

    await refreshBlockedIps();

    const blockedIps = await prisma.blockedIp.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: blockedIps });
  } catch (error) {
    return toNextResponse(error);
  }
}
