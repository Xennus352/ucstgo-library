"use client";

import { useEffect, useState } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TeacherMetrics } from "@/components/admin/teachers/teacher-metrics";
import { TeacherTableWrapper } from "@/components/admin/teachers/teacher-table-wrapper";
import Loading from "@/components/animations/Loading";

export default function TeacherManagementPage() {
  const [teachers, setTeachers] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch from the new Teacher API endpoint
        const res = await fetch("/api/admin/teachers");
        const result = await res.json();

        setTeachers(result.data || []);
      } catch (error) {
        console.error("Failed to fetch teachers:", error);
        setTeachers([]);
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
          Loading teacher records...
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
                  Teacher Management
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manage faculty accounts, academic assignments, and system
                  oversight.
                </p>
              </div>
            </div>

            {/* Defensive check: only render if teachers is not null */}
            {teachers && (
              <>
                <TeacherMetrics data={teachers} />
                <TeacherTableWrapper />
              </>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
