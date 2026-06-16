"use client";

import { useEffect, useState } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LibrarianMetrics } from "@/components/admin/library/librarian-metrics";
import { LibrarianTableWrapper } from "@/components/admin/library/LibrarianTableWrapper";


export default function LibrarianManagementPage() {
  const [librarians, setLibrarians] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch from the new Librarian API endpoint
        const res = await fetch("/api/admin/librarians");
        const result = await res.json();

        setLibrarians(result.data || []);
      } catch (error) {
        console.error("Failed to fetch librarians:", error);
        setLibrarians([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
        </div>
        <p className="mt-4 text-sm font-medium tracking-wide">
          Loading library records...
        </p>
        <p className="text-xs text-slate-400">syncing database index</p>
      </div>
    );

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <SidebarInset>
        <div className="flex flex-1 flex-col bg-[#f1f5f9] dark:bg-slate-950">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  Librarian Management
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage staff accounts, administrative access, and system
                  oversight.
                </p>
              </div>
            </div>

            {/* Defensive check: only render if librarians is not null */}
            {librarians && (
              <>
                <LibrarianMetrics data={librarians} />
                <LibrarianTableWrapper />
              </>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
