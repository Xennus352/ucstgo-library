"use client";

import { useMemo } from "react";

type Student = {
  id?: string;
  status?: "active" | "inactive" | "suspended";
  department?: string;
  year?: number;
};

interface Props {
  data: Student[];
}

export function StudentMetrics({ data }: Props) {
  const stats = useMemo(() => {
    const total = data.length;

    const active = data.filter((s) => s.status === "active").length;
    const inactive = data.filter((s) => s.status === "inactive").length;
    const suspended = data.filter((s) => s.status === "suspended").length;

    const departments = new Set(data.map((s) => s.department).filter(Boolean));

    const avgYear =
      data.length > 0
        ? (
            data.reduce((acc, s) => acc + (s.year || 0), 0) / data.length
          ).toFixed(1)
        : "0";

    return {
      total,
      active,
      inactive,
      suspended,
      departmentCount: departments.size,
      avgYear,
    };
  }, [data]);

  const cards = [
    {
      label: "Total Students",
      value: stats.total,
      color: "text-slate-900 dark:text-white",
    },
    {
      label: "Active",
      value: stats.active,
      color: "text-green-600",
    },
    {
      label: "Inactive",
      value: stats.inactive,
      color: "text-yellow-600",
    },
    {
      label: "Suspended",
      value: stats.suspended,
      color: "text-red-600",
    },
    {
      label: "Departments",
      value: stats.departmentCount,
      color: "text-blue-600",
    },
    {
      label: "Avg Year",
      value: stats.avgYear,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition"
        >
          <p className="text-sm text-slate-500">{card.label}</p>
          <h2 className={`text-2xl font-bold mt-2 ${card.color}`}>
            {card.value}
          </h2>
        </div>
      ))}
    </div>
  );
}