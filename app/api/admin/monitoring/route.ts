import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { toNextResponse } from "@/lib/errors";
import { requireRole, ALLOWED_ADMIN_ROLES } from "@/lib/services/auth.service";

export async function GET(req: Request) {
  try {
    await requireRole(req.headers, ALLOWED_ADMIN_ROLES);

    const url = new URL(req.url);
    const range = (url.searchParams.get("range") ?? "14d").toLowerCase();
    const validRanges = ["24h", "7d", "14d", "30d"];
    const resolved = validRanges.includes(range) ? range : "14d";
    const isHourly = resolved === "24h";
    const days = resolved === "30d" ? 30 : resolved === "7d" ? 7 : 14;
    const cutoff = new Date(
      Date.now() - (isHourly ? 24 : days) * 3600 * 1000,
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const lastHourStart = new Date(Date.now() - 3600 * 1000);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [
      totalVisits,
      uniqueVisitors,
      todayVisits,
      visitsLastHour,
      activeNow,
      totalEvents,
      blockedCount,
      seriesRows,
      topPaths,
      topIps,
      eventsByType,
      recentEvents,
      recentVisits,
      activeUsers,
      activeCount,
      blockedIps,
    ] = await Promise.all([
      prisma.visitLog.count(),
      prisma.$queryRaw<
        { count: number }[]
      >`SELECT COUNT(DISTINCT ip)::int AS count FROM visit_log WHERE ip IS NOT NULL`,
      prisma.visitLog.count({ where: { visitedAt: { gte: todayStart } } }),
      prisma.visitLog.count({ where: { visitedAt: { gte: lastHourStart } } }),
      prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(DISTINCT ip)::int AS count
        FROM visit_log
        WHERE ip IS NOT NULL AND "visitedAt" >= NOW() - INTERVAL '5 minutes'`,
      prisma.securityEvent.count(),
      prisma.blockedIp.count(),
      isHourly
        ? prisma.$queryRaw<{ label: string; count: number }[]>`
            SELECT TO_CHAR(date_trunc('hour', "visitedAt"), 'YYYY-MM-DD HH24:00') AS label,
                   COUNT(*)::int AS count
            FROM visit_log
            WHERE "visitedAt" >= ${cutoff}
            GROUP BY label
            ORDER BY label ASC`
        : prisma.$queryRaw<{ label: string; count: number }[]>`
            SELECT TO_CHAR("visitedAt", 'YYYY-MM-DD') AS label,
                   COUNT(*)::int AS count
            FROM visit_log
            WHERE "visitedAt" >= ${cutoff}
            GROUP BY label
            ORDER BY label ASC`,
      prisma.visitLog.groupBy({
        by: ["path"],
        _count: { _all: true },
        orderBy: { _count: { path: "desc" } },
        take: 8,
      }),
      prisma.visitLog.groupBy({
        by: ["ip"],
        _count: { _all: true },
        orderBy: { _count: { ip: "desc" } },
        take: 8,
      }),
      prisma.securityEvent.groupBy({
        by: ["eventType"],
        _count: { _all: true },
        orderBy: { _count: { eventType: "desc" } },
      }),
      prisma.securityEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.visitLog.findMany({
        orderBy: { visitedAt: "desc" },
        take: 8,
        select: { id: true, path: true, ip: true, visitedAt: true },
      }),
      prisma.activeUser.findMany({
        where: { lastSeenAt: { gte: fiveMinAgo } },
        orderBy: { lastSeenAt: "desc" },
        take: 5,
      }),
      prisma.activeUser.count({ where: { lastSeenAt: { gte: fiveMinAgo } } }),
      prisma.blockedIp.findMany({ orderBy: { createdAt: "desc" } }),
    ]);

    return NextResponse.json({
      data: {
        totalVisits,
        uniqueVisitors: uniqueVisitors[0]?.count ?? 0,
        todayVisits,
        visitsLastHour,
        activeNow: activeNow[0]?.count ?? 0,
        totalEvents,
        blockedCount,
        series: seriesRows,
        topPaths,
        topIps: topIps.filter((row: any) => row.ip),
        eventsByType,
        recentEvents,
        recentVisits,
        activeUsers,
        activeCount,
        blockedIps,
      },
    });
  } catch (error) {
    return toNextResponse(error);
  }
}
