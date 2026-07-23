import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function useReservations(params?: {
  page?: number;
  status?: string;
}) {
  const query = new URLSearchParams(
    Object.entries(params || {}).filter(([_, v]) => v !== undefined) as [string, string][],
  ).toString();
  return useSWR(`/api/reservations?${query}`, fetcher, {
    revalidateOnFocus: false,
  });
}

export function useNotifications() {
  return useSWR("/api/notifications", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });
}
