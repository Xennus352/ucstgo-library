"use client";

import * as React from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ActivityIcon,
  EyeIcon,
  UsersIcon,
  CalendarDaysIcon,
  ShieldAlertIcon,
  BanIcon,
  TrendingUpIcon,
  GlobeIcon,
  InboxIcon,
} from "lucide-react";

type OverviewData = {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  visitsLastHour: number;
  activeNow: number;
  totalEvents: number;
  blockedCount: number;
  series: { label: string; count: number }[];
  topPaths: { path: string; _count: { _all: number } }[];
  topIps: { ip: string; _count: { _all: number } }[];
  eventsByType: { eventType: string; _count: { _all: number } }[];
  recentEvents: {
    id: string;
    eventType: string;
    ip: string;
    path: string | null;
    createdAt: string;
  }[];
  recentVisits: { id: string; path: string; ip: string; visitedAt: string }[];
  activeCount: number;
  activeUsers: {
    id: string;
    name: string;
    email: string | null;
    studentId: string | null;
    role: string | null;
    path: string | null;
    lastSeenAt: string;
  }[];
  blockedIps: {
    id: string;
    ip: string;
    reason: string | null;
    createdAt: string;
  }[];
};

const RANGES = [
  { value: "24h", label: "24H" },
  { value: "7d", label: "7D" },
  { value: "14d", label: "14D" },
  { value: "30d", label: "30D" },
];

const typeStyles: Record<string, string> = {
  SCANNER_UA:
    "bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/40",
  PATH_PROBE:
    "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/40",
  RATE_BURST:
    "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40",
};

const typeLabels: Record<string, string> = {
  SCANNER_UA: "Scanner UA",
  PATH_PROBE: "Path Probe",
  RATE_BURST: "Rate Burst",
};

const cardClass =
  "rounded-xl border border-white/40 bg-white/70 backdrop-blur-md shadow-xs p-5 dark:bg-slate-900/60 dark:border-slate-800/40";

function useNow(intervalMs = 1000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

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

function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative flex size-2 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
    </span>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-900/40 dark:text-emerald-400">
      <LiveDot />
      Live
    </span>
  );
}

function MetricCard({
  icon,
  label,
  value,
  accent,
  live,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: string;
  live?: boolean;
}) {
  return (
    <div
      className={`${cardClass} space-y-2 transition-all duration-300 ${
        live ? "border-emerald-300/50 dark:border-emerald-800/50" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
          {live && <LiveDot />}
        </span>
        <div
          className={`flex items-center justify-center size-8 rounded-lg bg-gradient-to-br ${accent} text-white shadow-sm`}
        >
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

export function MonitoringOverview() {
  const [range, setRange] = React.useState("14d");
  const [liveTab, setLiveTab] = React.useState<"views" | "users">("views");
  const [lastUpdate, setLastUpdate] = React.useState<number | null>(null);
  const now = useNow();

  const { data, isLoading } = useSWR<{ data: OverviewData }>(
    `/api/admin/monitoring?range=${range}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 5000,
      keepPreviousData: true,
      onSuccess: () => setLastUpdate(Date.now()),
    },
  );

  const d = data?.data;
  const isHourly = range === "24h";
  const rangeTotal = (d?.series ?? []).reduce((sum, s) => sum + s.count, 0);
  const empty = !isLoading && (d?.series ?? []).every((s) => s.count === 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Monitoring & Security
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {lastUpdate
              ? `Updated ${timeAgo(new Date(lastUpdate).toISOString(), now)}`
              : "Connecting to live data..."}
          </p>
        </div>
        <LiveBadge />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          icon={<ActivityIcon className="size-4" />}
          label="Active Now"
          value={isLoading ? "..." : (d?.activeNow ?? 0)}
          accent="from-emerald-500 to-green-600"
          live
        />
        <MetricCard
          icon={<EyeIcon className="size-4" />}
          label="Visits Last Hour"
          value={isLoading ? "..." : (d?.visitsLastHour ?? 0).toLocaleString()}
          accent="from-blue-500 to-indigo-600"
        />
        <MetricCard
          icon={<UsersIcon className="size-4" />}
          label="Unique Visitors"
          value={isLoading ? "..." : (d?.uniqueVisitors ?? 0).toLocaleString()}
          accent="from-cyan-500 to-sky-600"
        />
        <MetricCard
          icon={<CalendarDaysIcon className="size-4" />}
          label="Visits Today"
          value={isLoading ? "..." : (d?.todayVisits ?? 0).toLocaleString()}
          accent="from-violet-500 to-purple-600"
        />
        <MetricCard
          icon={<ShieldAlertIcon className="size-4" />}
          label="Security Events"
          value={isLoading ? "..." : (d?.totalEvents ?? 0).toLocaleString()}
          accent="from-rose-500 to-red-600"
        />
        <MetricCard
          icon={<BanIcon className="size-4" />}
          label="Blocked IPs"
          value={isLoading ? "..." : (d?.blockedCount ?? 0).toLocaleString()}
          accent="from-slate-600 to-slate-800"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Visits chart */}
        <div className={`${cardClass} lg:col-span-2`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <TrendingUpIcon className="size-4 text-blue-500" />
                Website Visits
                <span className="text-xs font-normal text-slate-400">
                  {rangeTotal.toLocaleString()} in range
                </span>
              </h3>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200/70 bg-white/40 p-1 dark:bg-slate-950/40 dark:border-slate-800">
              {RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRange(r.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    range === r.value
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="h-72">
            {isLoading && !d ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Loading chart...
              </div>
            ) : empty ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                <InboxIcon className="size-8" />
                <p className="text-xs">No visits in this range yet.</p>
                <p className="text-[11px] text-slate-300 dark:text-slate-600">
                  This chart updates automatically as students browse the
                  library.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={d?.series ?? []}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                  barCategoryGap="28%"
                >
                  <defs>
                    <linearGradient id="visitBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={20}
                    tickFormatter={(v: string) =>
                      isHourly ? v.slice(11, 16) : v.slice(5).replace("-", "/")
                    }
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(59,130,246,0.06)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(148,163,184,0.25)",
                      background: "rgba(15,23,42,0.92)",
                      color: "#f8fafc",
                      fontSize: 12,
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                    }}
                    labelStyle={{ color: "#94a3b8", marginBottom: 4 }}
                    labelFormatter={(label) =>
                      isHourly
                        ? `${String(label).slice(0, 10)} · ${String(label).slice(11)}`
                        : `Date: ${String(label)}`
                    }
                    formatter={(value) => [`${value} visits`, "Visits"]}
                  />
                  <Bar
                    dataKey="count"
                    name="Visits"
                    fill="url(#visitBar)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live activity: page views / active users */}
        <div className={`${cardClass} flex flex-col`}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200/70 bg-white/40 p-1 dark:bg-slate-950/40 dark:border-slate-800">
              <button
                onClick={() => setLiveTab("views")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  liveTab === "views"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Page Views
              </button>
              <button
                onClick={() => setLiveTab("users")}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  liveTab === "users"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                Active Users
                {d && d.activeCount > 0 && (
                  <span className="ml-1.5 font-mono text-[10px]">
                    ({d.activeCount})
                  </span>
                )}
              </button>
            </div>
            <LiveDot />
          </div>

          {isLoading && !d ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Listening...
            </div>
          ) : liveTab === "views" ? (
            (d?.recentVisits ?? []).length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No page views yet — they appear here in real time.
              </p>
            ) : (
              <ul className="space-y-3">
                {d!.recentVisits.map((v, i) => (
                  <li
                    key={v.id}
                    className={`flex items-start justify-between gap-2 text-xs ${
                      i === 0
                        ? "text-slate-800 dark:text-slate-200"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <span className="flex items-start gap-2 min-w-0">
                      <span
                        className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                          i === 0
                            ? "bg-emerald-500 animate-pulse"
                            : "bg-slate-300 dark:bg-slate-700"
                        }`}
                      />
                      <span className="font-mono truncate">{v.path}</span>
                    </span>
                    <span className="shrink-0 whitespace-nowrap">
                      {timeAgo(v.visitedAt, now)}
                    </span>
                  </li>
                ))}
              </ul>
            )
          ) : (d?.activeUsers ?? []).length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No signed-in users active in the last 5 minutes.
            </p>
          ) : (
            <ul className="space-y-3">
              {d!.activeUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex items-start justify-between gap-2 text-xs"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {u.name}
                      </span>
                      <span className="shrink-0 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/40 px-1.5 py-px text-[10px] font-medium text-blue-600 dark:text-blue-300">
                        {u.role ?? "USER"}
                      </span>
                    </span>
                    <span className="mt-1 block pl-3 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                      {u.studentId ? `${u.studentId} · ` : ""}
                      {u.email ?? ""}
                    </span>
                    <span className="mt-0.5 block pl-3 text-[11px] text-slate-400 truncate">
                      {u.path ?? ""}
                    </span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-[11px] text-slate-400">
                    {timeAgo(u.lastSeenAt, now)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-auto pt-4 text-[11px] text-slate-400 dark:text-slate-600">
            {liveTab === "views"
              ? d?.recentVisits?.length
                ? `Last visit ${timeAgo(d.recentVisits[0].visitedAt, now)}`
                : "No activity"
              : `${d?.activeCount ?? 0} signed-in user(s) active in the last 5 minutes`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Detected threats */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Detected Threats
          </h3>
          {isLoading && !d ? (
            <div className="h-40 flex items-center justify-center text-xs text-slate-400">
              Loading...
            </div>
          ) : (d?.eventsByType ?? []).length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No security events recorded yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {d!.eventsByType.map((e) => (
                <li
                  key={e.eventType}
                  className="flex items-center justify-between rounded-lg border p-3 text-xs"
                >
                  <span
                    className={`inline-flex items-center gap-1.5 font-medium px-2 py-1 rounded-full border ${
                      typeStyles[e.eventType] ??
                      "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    <ShieldAlertIcon className="size-3" />
                    {typeLabels[e.eventType] ?? e.eventType}
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {e._count._all}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top pages */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <GlobeIcon className="size-4 text-blue-500" />
            Most Visited Pages
          </h3>
          {isLoading && !d ? (
            <p className="text-xs text-slate-400">Loading...</p>
          ) : (d?.topPaths ?? []).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No page visits recorded yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {d!.topPaths.map((p) => (
                <li
                  key={p.path}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-mono text-slate-600 dark:text-slate-400 truncate">
                    {p.path}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">
                    {p._count._all}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Top IPs */}
        <div className={cardClass}>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
            <UsersIcon className="size-4 text-emerald-500" />
            Top Visitor IPs
          </h3>
          {isLoading && !d ? (
            <p className="text-xs text-slate-400">Loading...</p>
          ) : (d?.topIps ?? []).length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              No visits recorded yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {d!.topIps.map((row) => (
                <li
                  key={row.ip}
                  className="flex items-center justify-between gap-3 text-xs"
                >
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {row.ip}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 shrink-0">
                    {row._count._all}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
