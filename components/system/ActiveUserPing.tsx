"use client";

import * as React from "react";

const PING_MS = 60000;
const URL_CHECK_MS = 5000;

export function ActiveUserPing() {
  const stopped = React.useRef(false);
  const lastPath = React.useRef<string | null>(null);

  React.useEffect(() => {
    const currentPath = () => window.location.pathname + window.location.search;

    const post = (path: string) => {
      fetch("/api/system/active-ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
        keepalive: true,
      })
        .then((res) => {
          if (res.status === 401) stopped.current = true;
        })
        .catch(() => {});
    };

    const heartbeat = () => {
      if (stopped.current) return;
      const path = currentPath();
      lastPath.current = path;
      post(path);
    };

    const checkUrl = () => {
      if (stopped.current) return;
      const path = currentPath();
      if (path === lastPath.current) return;
      lastPath.current = path;
      post(path);
    };

    heartbeat();
    const t = setInterval(heartbeat, PING_MS);
    const urlCheck = setInterval(checkUrl, URL_CHECK_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") checkUrl();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onVisible);

    return () => {
      clearInterval(t);
      clearInterval(urlCheck);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, []);

  return null;
}
