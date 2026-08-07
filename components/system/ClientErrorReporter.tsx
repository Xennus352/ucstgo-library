"use client";

import * as React from "react";

const DEDUPE_MS = 30000;
const recent = new Map<string, number>();

const IGNORED = /ResizeObserver loop|Script error\.|Non-Error promise rejection captured with value/;

function report(message: string, stack: string | null, fatal: boolean) {
  if (IGNORED.test(message)) return;
  const key = message.slice(0, 200);
  const last = recent.get(key);
  const now = Date.now();
  if (last && now - last < DEDUPE_MS) return;
  recent.set(key, now);

  fetch("/api/system/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      stack,
      url: window.location.href,
      fatal,
    }),
    keepalive: true,
  }).catch(() => {});
}

export function ClientErrorReporter() {
  React.useEffect(() => {
    const onError = (event: ErrorEvent) => {
      report(
        event.message || "Unknown script error",
        event.error?.stack ?? null,
        true,
      );
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";
      report(message, reason instanceof Error ? reason.stack ?? null : null, false);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
