"use client";

import * as React from "react";

const PING_MS = 60000;

export function ActiveUserPing() {
  const stopped = React.useRef(false);

  React.useEffect(() => {
    const send = () => {
      if (stopped.current) return;
      fetch("/api/system/active-ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: window.location.pathname }),
        keepalive: true,
      }).then((res) => {
        if (res.status === 401) stopped.current = true;
      }).catch(() => {});
    };

    send();
    const t = setInterval(send, PING_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") send();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);

    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, []);

  return null;
}
