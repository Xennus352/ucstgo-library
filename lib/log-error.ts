import prisma from "@/lib/prisma";

const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

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
      await prisma.errorLog.update({
        where: { id: existing.id },
        data: { count: { increment: 1 }, lastSeen: new Date() },
      });
      return;
    }

    await prisma.errorLog.create({
      data: {
        source: input.source,
        endpoint: input.endpoint ?? null,
        method: input.method ?? null,
        message,
        stack,
        severity: input.severity ?? "error",
        ip: input.ip ?? null,
      },
    });
  } catch {
    // Never let error logging break the request
  }
}
