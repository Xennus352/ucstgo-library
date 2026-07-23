import { cva, type VariantProps } from "class-variance-authority";

// ─── Color Tokens ────────────────────────────────────────────
export const colors = {
  brand: {
    primary: "hsl(var(--brand-primary))",
    secondary: "hsl(var(--brand-secondary))",
  },
  status: {
    available: "hsl(var(--status-available))",
    borrowed: "hsl(var(--status-borrowed))",
    overdue: "hsl(var(--status-overdue))",
    lost: "hsl(var(--status-lost))",
    damaged: "hsl(var(--status-damaged))",
  },
  glass: {
    bg: "hsl(var(--glass-bg))",
    border: "hsl(var(--glass-border))",
  },
};

// ─── Status Badge ────────────────────────────────────────────
export const statusBadge = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      status: {
        AVAILABLE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        BORROWED: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        OVERDUE: "bg-red-500/10 text-red-600 dark:text-red-400",
        LOST: "bg-red-500/10 text-red-600 dark:text-red-400",
        DAMAGED: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
        ACTIVE: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        FULFILLED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        CANCELLED: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400",
        EXPIRED: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400",
        RETURNED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        BORROWED_ALT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        available: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        borrowed: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        unavailable: "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400",
      },
    },
    defaultVariants: { status: "AVAILABLE" },
  },
);

// ─── Role Badge ──────────────────────────────────────────────
export const roleBadge = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      role: {
        ADMIN: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
        LIBRARIAN: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
        STUDENT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        LECTURER: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      },
    },
    defaultVariants: { role: "STUDENT" },
  },
);

// ─── Metric Card ─────────────────────────────────────────────
export const metricCard = cva(
  "relative overflow-hidden rounded-xl border p-6 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground shadow-sm",
        glass:
          "bg-white/60 dark:bg-neutral-900/60 backdrop-blur-xl border-white/20 dark:border-neutral-800/50",
        outline: "bg-transparent border-2",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

// ─── Action Button ───────────────────────────────────────────
export const actionButton = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200",
        secondary:
          "bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700",
        ghost:
          "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400",
        danger:
          "bg-red-600 text-white hover:bg-red-500",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

// ─── Page Container ──────────────────────────────────────────
export const pageContainer = cva(
  "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
);

// ─── Section Header ──────────────────────────────────────────
export const sectionHeader = cva(
  "flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between",
);

// ─── Section Title ───────────────────────────────────────────
export const sectionTitle = cva(
  "text-2xl font-semibold tracking-tight",
);

// ─── Empty State ──────────────────────────────────────────────
export const emptyState = cva(
  "flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center",
);

export type StatusBadgeProps = VariantProps<typeof statusBadge>;
export type RoleBadgeProps = VariantProps<typeof roleBadge>;
export type MetricCardProps = VariantProps<typeof metricCard>;
export type ActionButtonProps = VariantProps<typeof actionButton>;
