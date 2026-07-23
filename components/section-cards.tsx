"use client";

import { useEffect, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import { BookOpenIcon, UsersIcon, LayersIcon } from "lucide-react";
import { getLibraryStats } from "@/app/actions/bookStatus";

type LibraryMetrics = {
  totalBooks: number;
  totalAuthors: number;
  totalCategories: number;
  booksThisMonthTrend?: number;
};

export function SectionCards() {
  const [metrics, setMetrics] = useState<LibraryMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const response = await getLibraryStats();

      if (response.success && response.data) {
        setMetrics(response.data as LibraryMetrics);
      }

      setLoading(false);
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-card text-card-foreground rounded-xl border shadow-sm animate-pulse p-6">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="mt-3 h-8 w-20 bg-muted-foreground/20 rounded" />
            <div className="mt-2 h-3 w-full bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-3">
      <MetricCard
        icon={<BookOpenIcon className="size-5 text-emerald-600" />}
        label="Total Books"
        value={metrics?.totalBooks ?? 0}
        trend={{ value: `${metrics?.booksThisMonthTrend ?? 0} this month`, positive: true }}
      />
      <MetricCard
        icon={<UsersIcon className="size-5 text-blue-600" />}
        label="Total Authors"
        value={metrics?.totalAuthors ?? 0}
        trend={{ value: "Active contributors", positive: true }}
      />
      <MetricCard
        icon={<LayersIcon className="size-5 text-purple-600" />}
        label="Total Categories"
        value={metrics?.totalCategories ?? 0}
        trend={{ value: "Genres & classifications", positive: true }}
      />
    </div>
  );
}
