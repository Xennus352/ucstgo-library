"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useSocketEvent } from "@/hooks/use-socket";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { AlertTriangleIcon } from "lucide-react";

type IssuePayload = {
  id: string;
  source: string;
  endpoint: string | null;
  method: string | null;
  message: string;
  severity: string;
  count: number;
  at: string;
};

export function MonitoringIssueBadge() {
  const { user } = useCurrentUser();
  const pathname = usePathname();
  const [unseen, setUnseen] = React.useState(0);
  const isMonitoring = pathname === "/admin/monitoring";
  const isAdmin = user?.role === "ADMIN" || user?.role === "LIBRARIAN";

  React.useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/admin/system-errors?status=open&page=1&limit=1")
      .then((r) => r.json())
      .then((d) => {
        const open = Number(d?.meta?.counts?.open ?? 0);
        setUnseen((u) => (d?.meta?.counts?.open !== undefined ? open : u));
      })
      .catch(() => {});
  }, [isAdmin]);

  useSocketEvent("issue:new", (data: unknown) => {
    if (!isAdmin) return;
    const issue = (data ?? {}) as Partial<IssuePayload>;
    const page = issue.endpoint ? issue.endpoint.split("?")[0] : "/";
    setTimeout(() => setUnseen((u) => u + 1), 0);
    toast.error(
      <div className="space-y-0.5">
        <p className="flex items-center gap-1.5 font-semibold">
          <AlertTriangleIcon className="size-3.5" />
          {issue.source ?? "System"} issue detected
        </p>
        <p className="text-xs opacity-90 font-mono truncate">{page}</p>
        <p className="text-xs opacity-90 line-clamp-2">
          {issue.message ?? "Unknown error"}
        </p>
      </div>,
      { duration: 8000 },
    );
  });

  React.useEffect(() => {
    if (isMonitoring) setUnseen(0);
  }, [isMonitoring]);

  if (unseen === 0) return null;

  return (
    <span
      className={`
        ml-auto inline-flex items-center justify-center gap-0.5
        min-w-5 h-5 px-1.5 rounded-full
        bg-red-600 text-white text-[10px] font-bold leading-none shadow-sm
        ${isMonitoring ? "" : "animate-pulse"}
      `}
    >
      {unseen > 99 ? "99+" : unseen}
    </span>
  );
}
