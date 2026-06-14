"use client";

import { useMemo } from "react";
import { ShieldUser, UserCheck, UserX, BookOpenText } from "lucide-react";

type Librarian = {
  id?: string;
  banned?: boolean;
  booksManagedCount?: number;
};

interface Props {
  data: Librarian[];
}

export function LibrarianMetrics({ data }: Props) {
  const stats = useMemo(() => {
    const total = data.length;
    const active = data.filter((l) => !l.banned).length;
    const banned = data.filter((l) => l.banned).length;
    const totalManaged = data.reduce(
      (acc, l) => acc + (l.booksManagedCount || 0),
      0,
    );
    return { total, active, banned, totalManaged };
  }, [data]);

  const cards = [
    {
      label: "Total Librarians",
      value: stats.total,
      icon: ShieldUser,
      color: "text-slate-600",
      bg: "bg-slate-100",
    },
    {
      label: "Active Staff",
      value: stats.active,
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Banned",
      value: stats.banned,
      icon: UserX,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Books Managed",
      value: stats.totalManaged,
      icon: BookOpenText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
              <card.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {card.label}
              </p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                {card.value}
              </h3>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
