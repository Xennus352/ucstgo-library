import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toNextResponse } from "@/lib/errors";
import { requireRole, ALLOWED_ADMIN_ROLES } from "@/lib/services/auth.service";

const VALID_STATUS = ["open", "investigating", "resolved"] as const;

export async function GET(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);

    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? "open";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 15));

    const where =
      status === "all"
        ? {}
        : { status: VALID_STATUS.includes(status as never) ? status : "open" };

    const [rows, total, counts, last24h] = await Promise.all([
      prisma.errorLog.findMany({
        where,
        orderBy: { lastSeen: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.errorLog.count({ where }),
      prisma.errorLog.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.errorLog.count({
        where: { lastSeen: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
      }),
    ]);

    const countsMap: Record<string, number> = {
      open: 0,
      investigating: 0,
      resolved: 0,
    };
    for (const c of counts) {
      countsMap[c.status] = c._count._all;
    }

    return NextResponse.json({
      data: rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        counts: { ...countsMap, last24h },
      },
    });
  } catch (error) {
    return toNextResponse(error);
  }
}
