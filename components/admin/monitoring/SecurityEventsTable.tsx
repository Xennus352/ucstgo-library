"use client";

import * as React from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { toast } from "sonner";
import {
  ShieldAlertIcon,
  BanIcon,
  ShieldCheckIcon,
  Loader2Icon,
} from "lucide-react";
import { BookPagination } from "@/components/books/BookPagination";
import { Button } from "@/components/ui/button";

type SecurityEvent = {
  id: string;
  eventType: string;
  ip: string;
  path: string | null;
  userAgent: string | null;
  count: number;
  createdAt: string;
};

type BlockedIp = {
  id: string;
  ip: string;
  reason: string | null;
  createdAt: string;
};

const typeStyles: Record<string, string> = {
  SCANNER_UA: "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/40",
  PATH_PROBE: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40",
  RATE_BURST: "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40",
};

const typeLabels: Record<string, string> = {
  SCANNER_UA: "Scanner UA",
  PATH_PROBE: "Path Probe",
  RATE_BURST: "Rate Burst",
};

const FILTERS = [
  { value: "", label: "All" },
  { value: "SCANNER_UA", label: "Scanner UA" },
  { value: "PATH_PROBE", label: "Path Probe" },
  { value: "RATE_BURST", label: "Rate Burst" },
];

export function SecurityEventsTable() {
  const [type, setType] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [busyIp, setBusyIp] = React.useState<string | null>(null);

  const { data, isLoading, mutate } = useSWR<{
    data: SecurityEvent[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(
    `/api/admin/monitoring/events?page=${page}&limit=15&type=${type}`,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 5000 },
  );

  const { data: overviewData } = useSWR<{ data: { blockedIps: BlockedIp[] } }>(
    "/api/admin/monitoring",
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 10000 },
  );

  const blockedIps = overviewData?.data?.blockedIps ?? [];

  const handleToggleBlock = async (ip: string, block: boolean) => {
    setBusyIp(ip);
    try {
      const res = await fetch("/api/admin/monitoring/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, blocked: block }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to update blocklist");
      }
      toast.success(
        block ? `${ip} has been blocked` : `${ip} has been unblocked`,
      );
      mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusyIp(null);
    }
  };

  const isBlocked = (ip: string) => blockedIps.some((b) => b.ip === ip);
  const events = data?.data ?? [];
  const totalPages = data?.meta?.totalPages || 1;

  return (
    <div className="rounded-xl border border-white/40 bg-white/70 backdrop-blur-md shadow-xs p-6 space-y-4 dark:bg-slate-900/60 dark:border-slate-800/40">
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <ShieldAlertIcon className="size-4 text-rose-500" />
          Security Events
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            Live · 5s
          </span>
        </h3>

        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setType(f.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                type === f.value
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white/40 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Blocked IPs summary */}
      {blockedIps.length > 0 && (
        <div className="rounded-lg border border-rose-200/60 bg-rose-50/50 dark:bg-rose-950/20 dark:border-rose-900/30 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-500 mb-2 flex items-center gap-1.5">
            <BanIcon className="size-3" /> Blocked IPs ({blockedIps.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {blockedIps.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 px-2.5 py-1 font-mono text-xs text-rose-700 dark:text-rose-300"
              >
                {b.ip}
                <button
                  onClick={() => handleToggleBlock(b.ip, false)}
                  disabled={busyIp === b.ip}
                  className="text-rose-400 hover:text-rose-600 cursor-pointer"
                  title="Unblock"
                >
                  <XIcon className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 dark:bg-slate-900/40 text-slate-500 font-semibold text-xs tracking-wider uppercase">
              <th className="p-4">Time</th>
              <th className="p-4">Type</th>
              <th className="p-4">IP Address</th>
              <th className="p-4">Path</th>
              <th className="p-4">User Agent</th>
              <th className="p-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <Loader2Icon className="size-6 animate-spin text-blue-500 mx-auto" />
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400">
                  No security events found.
                </td>
              </tr>
            ) : (
              events.map((ev) => (
                <tr
                  key={ev.id}
                  className="hover:bg-white/50 dark:hover:bg-slate-900/30 transition-colors"
                >
                  <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(ev.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 font-medium px-2 py-1 rounded-full border text-xs ${
                        typeStyles[ev.eventType] ??
                        "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {typeLabels[ev.eventType] ?? ev.eventType}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-700 dark:text-slate-300">
                    {ev.ip}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500 max-w-40 truncate">
                    {ev.path || "—"}
                  </td>
                  <td className="p-4 text-xs text-slate-400 max-w-48 truncate">
                    {ev.userAgent || "—"}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center">
                      {isBlocked(ev.ip) ? (
                        <button
                          onClick={() => handleToggleBlock(ev.ip, false)}
                          disabled={busyIp === ev.ip}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-emerald-200/60 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer disabled:opacity-50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40"
                        >
                          {busyIp === ev.ip ? (
                            <Loader2Icon className="size-3 animate-spin" />
                          ) : (
                            <ShieldCheckIcon className="size-3" />
                          )}
                          Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleBlock(ev.ip, true)}
                          disabled={busyIp === ev.ip}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-rose-200/60 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer disabled:opacity-50 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40"
                        >
                          {busyIp === ev.ip ? (
                            <Loader2Icon className="size-3 animate-spin" />
                          ) : (
                            <BanIcon className="size-3" />
                          )}
                          Block IP
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
          Showing{" "}
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {events.length}
          </span>{" "}
          of <span className="font-mono">{data?.meta?.total ?? 0}</span> events
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
