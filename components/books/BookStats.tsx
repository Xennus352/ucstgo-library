"use client";

import { useEffect, useState } from "react";
import { BookOpen, Filter, Package, Users } from "lucide-react";
import { getLibraryStats } from "@/app/actions/bookStatus";

type StatItem = {
  label: string;
  value: string;
  color: string;
  icon: React.ComponentType<any>;
};

export function BookStats() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const response = await getLibraryStats();
      if (response.success && response.data) {
        const d = response.data;
        setStats([
          {
            label: "Total Books",
            value: d.totalBooks,
            color: "blue",
            icon: BookOpen,
          },

          {
            label: "Available Copies",
            value: d.availableCopies,
            color: "amber",
            icon: Package,
          },
          {
            label: "Categories",
            value: d.totalCategories,
            color: "purple",
            icon: Filter,
          },
        ]);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: "bg-blue-100 dark:bg-blue-950", text: "text-blue-600" },
      emerald: {
        bg: "bg-emerald-100 dark:bg-emerald-950",
        text: "text-emerald-600",
      },
      amber: { bg: "bg-amber-100 dark:bg-amber-950", text: "text-amber-600" },
      purple: {
        bg: "bg-purple-100 dark:bg-purple-950",
        text: "text-purple-600",
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-xl p-4 animate-pulse h-24 border border-slate-200 dark:border-slate-700"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        const colorClasses = getColorClasses(stat.color);

        return (
          <div
            key={stat.label}
            className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div
                className={`w-12 h-12 ${colorClasses.bg} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <Icon className={`w-6 h-6 ${colorClasses.text}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
