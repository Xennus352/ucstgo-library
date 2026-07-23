import type { ReactNode } from "react";
import { metricCard, type MetricCardProps } from "@/lib/design-tokens";

export function MetricCard({
  variant = "default",
  icon,
  label,
  value,
  trend,
  className,
}: {
  variant?: MetricCardProps["variant"];
  icon?: ReactNode;
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
  className?: string;
}) {
  return (
    <div className={metricCard({ variant, className })}>
      {icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800">
          {icon}
        </div>
      )}
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      {trend && (
        <p
          className={`mt-1 text-xs ${trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
        >
          {trend.positive ? "↑" : "↓"} {trend.value}
        </p>
      )}
    </div>
  );
}
