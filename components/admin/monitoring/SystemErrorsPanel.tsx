"use client";

import * as React from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { toast } from "sonner";
import {
  BugIcon,
  Loader2Icon,
  SearchCheckIcon,
  WrenchIcon,
  RotateCcwIcon,
} from "lucide-react";
import { BookPagination } from "@/components/books/BookPagination";
import { Button } from "@/components/ui/button";
import { useSocketEvent } from "@/hooks/use-socket";

type SystemError = {
  id: string;
  source: string;
  endpoint: string | null;
  method: string | null;
  message: string;
  stack: string | null;
  severity: string;
  status: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  ip: string | null;
};

const FILTERS = [
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
];

const statusStyles: Record<string, string> = {
  open: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40",
  investigating:
    "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40",
  resolved:
    "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40",
};

const sourceStyles: Record<string, string> = {
  http: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40",
  api: "bg-violet-50 text-violet-700 border-violet-200/60 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900/40",
  client:
    "bg-cyan-50 text-cyan-700 border-cyan-200/60 dark:bg-cyan-950/30 dark:text-cyan-300 dark:border-cyan-900/40",
  db: "bg-orange-50 text-orange-700 border-orange-200/60 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-900/40",
  action:
    "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40",
};

const sourceLabels: Record<string, string> = {
  http: "HTTP",
  api: "API",
  client: "Browser",
  db: "Database",
  action: "Action",
};

function timeAgo(dateStr: string, now: number) {
  const diff = Math.max(0, now - new Date(dateStr).getTime());
  if (diff < 10000) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function SystemErrorsPanel() {
  const [status, setStatus] = React.useState("open");
  const [page, setPage] = React.useState(1);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading, mutate } = useSWR<{
    data: SystemError[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      counts: { open: number; investigating: number; resolved: number; last24h: number };
    };
  }>(
    `/api/admin/system-errors?status=${status}&page=${page}&limit=15`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 10000 },
  );

  useSocketEvent("issue:new", () => {
    void mutate();
  });

  const errors = data?.data ?? [];
  const counts = data?.meta?.counts ?? { open: 0, investigating: 0, resolved: 0, last24h: 0 };
  const totalPages = data?.meta?.totalPages || 1;

  const setStatusAction = async (id: string, next: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/system-errors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update issue");
      }
      toast.success(
        next === "resolved"
          ? "Issue marked as resolved"
          : next === "investigating"
            ? "Issue marked as investigating"
            : "Issue reopened",
      );
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-xl border border-white/40 bg-white/70 backdrop-blur-md shadow-xs p-6 space-y-4 dark:bg-slate-900/60 dark:border-slate-800/40">
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <BugIcon className="size-4 text-amber-500" />
          System Issues
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            Live · 10s
          </span>
        </h3>

        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatus(f.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                status === f.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white/40 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              {f.label}
              <span className="ml-1.5 font-mono opacity-80">
                {f.value === "all" ? "" : counts[f.value as keyof typeof counts] ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Health chips */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300">
          <SearchCheckIcon className="size-3" /> Issues in last 24h:
          <b className="font-mono">{counts.last24h}</b>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-900/40 px-2.5 py-1 text-xs text-rose-700 dark:text-rose-300">
          Open: <b className="font-mono">{counts.open}</b>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 px-2.5 py-1 text-xs text-amber-700 dark:text-amber-300">
          Investigating: <b className="font-mono">{counts.investigating}</b>
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300">
          Resolved: <b className="font-mono">{counts.resolved}</b>
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 dark:bg-slate-900/40 text-slate-500 font-semibold text-xs tracking-wider uppercase">
              <th className="p-4">Status</th>
              <th className="p-4">Source</th>
              <th className="p-4">Message</th>
              <th className="p-4">Endpoint</th>
              <th className="p-4 text-center">Count</th>
              <th className="p-4">Last Seen</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <Loader2Icon className="size-6 animate-spin text-blue-500 mx-auto" />
                </td>
              </tr>
            ) : errors.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <p className="text-slate-400 text-sm">
                    {status === "open"
                      ? "No open issues — all systems healthy."
                      : "No issues with this status."}
                  </p>
                </td>
              </tr>
            ) : (
              errors.map((err) => (
                <tr
                  key={err.id}
                  className="hover:bg-white/50 dark:hover:bg-slate-900/30 transition-colors"
                >
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 font-medium px-2 py-1 rounded-full border text-xs ${
                        statusStyles[err.status] ?? ""
                      }`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {err.status}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium ${
                        sourceStyles[err.source] ?? "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {sourceLabels[err.source] ?? err.source}
                    </span>
                  </td>
                  <td className="p-4 max-w-72">
                    <p
                      className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate"
                      title={err.stack ?? err.message}
                    >
                      {err.message}
                    </p>
                    {err.endpoint && (
                      <p className="text-[11px] font-mono text-slate-400 truncate">
                        {err.method ?? ""} {err.endpoint}
                      </p>
                    )}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500 max-w-48 truncate">
                    {err.endpoint || "—"}
                  </td>
                  <td className="p-4 text-center">
                    {err.count > 1 ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
                        ×{err.count}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">1</span>
                    )}
                  </td>
                  <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                    {timeAgo(err.lastSeen, now)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {err.status === "open" && (
                        <button
                          onClick={() => setStatusAction(err.id, "investigating")}
                          disabled={busyId === err.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-amber-200/60 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer disabled:opacity-50 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40"
                        >
                          {busyId === err.id ? (
                            <Loader2Icon className="size-3 animate-spin" />
                          ) : (
                            <WrenchIcon className="size-3" />
                          )}
                          Investigate
                        </button>
                      )}
                      {err.status === "investigating" && (
                        <button
                          onClick={() => setStatusAction(err.id, "resolved")}
                          disabled={busyId === err.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-emerald-200/60 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40"
                        >
                          {busyId === err.id ? (
                            <Loader2Icon className="size-3 animate-spin" />
                          ) : (
                            <SearchCheckIcon className="size-3" />
                          )}
                          Resolve
                        </button>
                      )}
                      {err.status === "resolved" && (
                        <button
                          onClick={() => setStatusAction(err.id, "open")}
                          disabled={busyId === err.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-800"
                        >
                          {busyId === err.id ? (
                            <Loader2Icon className="size-3 animate-spin" />
                          ) : (
                            <RotateCcwIcon className="size-3" />
                          )}
                          Reopen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-2 text-xs text-slate-500 font-medium">
        <span>
          Showing <b className="text-slate-700 dark:text-slate-300">{errors.length}</b> of{" "}
          <span className="font-mono">{data?.meta?.total ?? 0}</span> issues
        </span>
                <BookPagination
          page={page}
          totalPages={totalPages}
          hasNextPage={page < totalPages}
          isLoading={isLoading}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
