import { statusBadge } from "@/lib/design-tokens";

const statusVariantMap: Record<string, string> = {
  Available: "AVAILABLE",
  Borrowed: "BORROWED",
  Overdue: "OVERDUE",
  Lost: "LOST",
  Damaged: "DAMAGED",
  Returned: "RETURNED",
  Active: "ACTIVE",
  Fulfilled: "FULFILLED",
  Cancelled: "CANCELLED",
  Expired: "EXPIRED",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant = statusVariantMap[status] ?? status;
  return (
    <span className={statusBadge({ status: variant as any, className })}>
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
}
