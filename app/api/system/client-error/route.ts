import { NextResponse } from "next/server";
import { logSystemError } from "@/lib/log-error";

const ipHits = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 60000;
const MAX_PER_WINDOW = 5;

function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? null;
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);

    const now = Date.now();
    const hit = ipHits.get(ip ?? "unknown");
    if (!hit || now - hit.windowStart > WINDOW_MS) {
      ipHits.set(ip ?? "unknown", { count: 1, windowStart: now });
    } else {
      hit.count += 1;
      if (hit.count > MAX_PER_WINDOW) {
        return NextResponse.json({ ok: false }, { status: 429 });
      }
    }

    const body = await req.json().catch(() => null);
    const message =
      typeof body?.message === "string"
        ? body.message.slice(0, 1000)
        : "Unknown client error";
    const stack =
      typeof body?.stack === "string" ? body.stack.slice(0, 4000) : null;
    const url = typeof body?.url === "string" ? body.url.slice(0, 500) : null;
    const severity =
      body?.fatal === true
        ? ("critical" as const)
        : ("error" as const);

    await logSystemError({
      source: "client",
      endpoint: url,
      method: null,
      message,
      stack,
      severity,
      ip,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
