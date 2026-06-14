"use client";

import { useMemo } from "react";
import { Users, BookOpen, Clock, Ban } from "lucide-react"; 

type Student = {
  id?: string;
  banned?: boolean;
  borrowRecords?: any[];
  reservations?: any[];
};

interface Props {
  data: Student[];
}

export function StudentMetrics({ data }: Props) {
  const stats = useMemo(() => {
    const total = data.length;
    // Count students where banned is explicitly true
    const bannedCount = data.filter((s) => s.banned === true).length;

    const totalBorrowed = data.reduce(
      (acc, s) => acc + (s.borrowRecords?.length || 0),
      0,
    );
    const totalReservations = data.reduce(
      (acc, s) => acc + (s.reservations?.length || 0),
      0,
    );

    return { total, bannedCount, totalBorrowed, totalReservations };
  }, [data]);

  const cards = [
    {
      label: "Total Students",
      value: stats.total,
      icon: Users,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
    {
      label: "Banned Users",
      value: stats.bannedCount,
      icon: Ban,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Active Loans",
      value: stats.totalBorrowed,
      icon: BookOpen,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Reservations",
      value: stats.totalReservations,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
              <card.icon size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.label}
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {card.value}
              </h3>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
