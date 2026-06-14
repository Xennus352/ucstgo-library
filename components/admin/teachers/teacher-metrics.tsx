"use client";

import { useMemo } from "react";
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react";

// Assuming User model from your Prisma schema
type User = {
  role: "ADMIN" | "LIBRARIAN" | "STUDENT" | "LECTURER";
  banned?: boolean; // Make it optional to handle missing data
  phone: string | null;
  email: string;
  name?: string;
  id?: string;
};

interface Props {
  data: User[];
}

export function TeacherMetrics({ data }: Props) {
  const stats = useMemo(() => {
    // Filter only for LECTURERS as per your schema
    const lecturers = data.filter((u) => u.role === "LECTURER");

    // Debug logging to check the data
    console.log("All lecturers:", lecturers);
    console.log(
      "Lecturer banned statuses:",
      lecturers.map((t) => ({ name: t.name, banned: t.banned })),
    );

    return {
      total: lecturers.length,
      active: lecturers.filter((t) => t.banned === false).length, // Explicit check for false
      banned: lecturers.filter((t) => t.banned === true).length, // Explicit check for true
      withPhone: lecturers.filter((t) => t.phone && t.phone.trim() !== "")
        .length,
      withEmail: lecturers.filter((t) => t.email && t.email.trim() !== "")
        .length,
      undefinedBanned: lecturers.filter(
        (t) => t.banned === undefined || t.banned === null,
      ).length, // Track undefined
    };
  }, [data]);

  const metrics = [
    {
      label: "Total Lecturers",
      value: stats.total,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      label: "Active",
      value: stats.active,
      icon: ShieldCheck,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/20",
    },
    {
      label: "Banned",
      value: stats.banned,
      icon: ShieldAlert,
      color: "text-rose-600",
      bgColor: "bg-rose-50 dark:bg-rose-950/20",
    },
    {
      label: "Contactable (Phone)",
      value: stats.withPhone,
      icon: Phone,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/20",
    },
    {
      label: "With Email",
      value: stats.withEmail,
      icon: Mail,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
    },
  ];

  // Show warning if there are undefined banned statuses
  const hasUndefinedBanned = stats.undefinedBanned > 0;

  return (
    <div className="space-y-4">
      {hasUndefinedBanned && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <p className="text-xs">
              Warning: {stats.undefinedBanned} lecturer(s) have undefined banned
              status. Please ensure the banned field is included in your API
              response.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {metrics.map((item) => (
          <div
            key={item.label}
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${item.bgColor} ${item.color}`}>
                <item.icon size={20} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {item.label}
                </p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {item.value}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
