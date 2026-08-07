"use client";

import * as React from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import {
  UsersIcon,
  SearchIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react";
import { BookPagination } from "@/components/books/BookPagination";
import { Button } from "@/components/ui/button";

type ActiveUser = {
  id: string;
  name: string;
  email: string | null;
  studentId: string | null;
  role: string | null;
  path: string | null;
  lastSeenAt: string;
};

type ActiveUsersResponse = {
  data: ActiveUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

const ROLE_FILTERS = [
  { value: "", label: "All" },
  { value: "STUDENT", label: "Students" },
  { value: "LECTURER", label: "Lecturers" },
  { value: "LIBRARIAN", label: "Librarians" },
  { value: "ADMIN", label: "Admins" },
];

const roleStyles: Record<string, string> = {
  ADMIN:
    "bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40",
  LIBRARIAN:
    "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/40",
  LECTURER:
    "bg-violet-50 text-violet-700 border-violet-200/60 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-900/40",
  STUDENT:
    "bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/40",
};

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

export function ActiveUsersPanel() {
  const [page, setPage] = React.useState(1);
  const [role, setRole] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState("");
  const now = useNow();

  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const query = new URLSearchParams({
    page: String(page),
    limit: "15",
  });
  if (search) query.set("search", search);
  if (role) query.set("role", role);

  const { data, isLoading, error } = useSWR<ActiveUsersResponse>(
    `/api/admin/monitoring/active-users?${query.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 5000,
      keepPreviousData: true,
    },
  );

  const users = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;

  return (
    <div className="rounded-xl border border-white/40 bg-white/70 backdrop-blur-md shadow-xs p-6 space-y-4 dark:bg-slate-900/60 dark:border-slate-800/40">
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <UsersIcon className="size-4 text-emerald-500" />
          Active Users
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            Live · 5s
          </span>
          <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
            {total}
          </span>
        </h3>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 sm:flex-none sm:w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, roll no., or email..."
              className="w-full pl-9 pr-8 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <XIcon className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {ROLE_FILTERS.map((f) => (
              <button
                key={f.value || "all"}
                onClick={() => {
                  setRole(f.value);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  role === f.value
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white/40 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 dark:bg-slate-900/40 text-slate-500 font-semibold text-xs tracking-wider uppercase">
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">Roll No. / Email</th>
              <th className="p-4">Current Page</th>
              <th className="p-4">Last Seen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading && !data ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <Loader2Icon className="size-6 animate-spin text-emerald-500 mx-auto" />
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400 text-sm">
                  Failed to load active users.
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <p className="text-slate-400 text-sm">
                    {search || role
                      ? "No active users match your filters."
                      : "No signed-in users active in the last 5 minutes."}
                  </p>
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-white/50 dark:hover:bg-slate-900/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <span className="relative flex size-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {u.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium ${
                        roleStyles[u.role ?? ""] ??
                        "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {u.role ?? "USER"}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500 max-w-56 truncate">
                    {u.studentId ? `${u.studentId} · ` : ""}
                    {u.email ?? "—"}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500 max-w-56 truncate">
                    {u.path ?? "—"}
                  </td>
                  <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                    {timeAgo(u.lastSeenAt, now)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-2 text-xs text-slate-500 font-medium">
        <span>
          Showing <b className="text-slate-700 dark:text-slate-300">{users.length}</b> of{" "}
          <span className="font-mono">{total}</span> active users
          <span className="text-slate-400"> · last 5 minutes</span>
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
