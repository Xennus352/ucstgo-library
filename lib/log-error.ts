import prisma from "@/lib/prisma";
import { getIO } from "@/lib/socket";
import { logger } from "@/lib/logger";

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

function notifyIssue(row: {
  id: string;
  source: string;
  endpoint?: string | null;
  method?: string | null;
  message: string;
  severity?: string;
  count: number;
}) {
  try {
    getIO()?.emit("issue:new", {
      id: row.id,
      source: row.source,
      endpoint: row.endpoint ?? null,
      method: row.method ?? null,
      message: row.message,
      severity: row.severity ?? "error",
      count: row.count,
      status: "open",
      at: new Date().toISOString(),
    });
  } catch {
    // Socket emission must never break error logging
  }
}

/** Convenience wrapper for server-action failures. */
export function logActionIssue(
  action: string,
  message: string,
  opts?: {
    severity?: "error" | "warning" | "critical";
    stack?: string | null;
  },
) {
  if (message.startsWith("Unauthorized")) return Promise.resolve();
  return logSystemError({
    source: "action",
    endpoint: action,
    method: null,
    message,
    stack: opts?.stack ?? null,
    severity: opts?.severity ?? "warning",
  });
}

export function errorMessage(error: unknown, fallback = "unknown error") {
  return error instanceof Error ? error.message : fallback;
}

export function errorStack(error: unknown) {
  return error instanceof Error ? error.stack ?? null : null;
}

/**
 * Log a system issue (fire-and-forget). Identical (source, endpoint,
 * method, message) occurrences within the dedupe window bump `count`
 * instead of creating new rows.
 */
export async function logSystemError(input: {
  source: "api" | "client" | "action";
  endpoint?: string | null;
  method?: string | null;
  message: string;
  stack?: string | null;
  severity?: "error" | "warning" | "critical";
  ip?: string | null;
}) {
  try {
    const message = input.message.slice(0, 1000);
    const stack = (input.stack ?? "").slice(0, 4000) || null;

    const existing = await prisma.errorLog.findFirst({
      where: {
        source: input.source,
        endpoint: input.endpoint ?? null,
        method: input.method ?? null,
        message,
      },
      orderBy: { lastSeen: "desc" },
      select: { id: true, lastSeen: true, status: true },
    });

    if (
      existing &&
      Date.now() - existing.lastSeen.getTime() < DEDUPE_WINDOW_MS
    ) {
      const updated = await prisma.errorLog.update({
        where: { id: existing.id },
        data: { count: { increment: 1 }, lastSeen: new Date() },
        select: { id: true, count: true },
      });
      notifyIssue({
        id: updated.id,
        source: input.source,
        endpoint: input.endpoint,
        method: input.method,
        message,
        severity: input.severity,
        count: updated.count,
      });
      return;
    }

    const created = await prisma.errorLog.create({
      data: {
        source: input.source,
        endpoint: input.endpoint ?? null,
        method: input.method ?? null,
        message,
        stack,
        severity: input.severity ?? "error",
        ip: input.ip ?? null,
      },
      select: { id: true },
    });
    notifyIssue({
      id: created.id,
      source: input.source,
      endpoint: input.endpoint,
      method: input.method,
      message,
      severity: input.severity,
      count: 1,
    });
  } catch (err: unknown) {
    logger.error({ err: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined }, "Failed to log system error");
    // Never let error logging break the request
  }
}
