import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import { useSocketEvent } from "@/hooks/use-socket";

function useCirculationSync() {
  const { mutate } = useSWRConfig();
  useSocketEvent("reservation:created", () => {
    mutate((key) => typeof key === "string" && key.startsWith("/api/reservations"));
  });
  useSocketEvent("reservation:status", () => {
    mutate((key) => typeof key === "string" && (key.startsWith("/api/reservations") || key.startsWith("/api/books")));
  });
  useSocketEvent("borrow:created", () => {
    mutate((key) => typeof key === "string" && (key.startsWith("/api/reservations") || key.startsWith("/api/books")));
  });
  useSocketEvent("borrow:returned", () => {
    mutate((key) => typeof key === "string" && (key.startsWith("/api/reservations") || key.startsWith("/api/books")));
  });
}

export function useReservations(params?: {
  page?: number;
  status?: string;
}) {
  useCirculationSync();
  const query = new URLSearchParams(
    Object.entries(params || {}).filter(([_, v]) => v !== undefined) as [string, string][],
  ).toString();
  return useSWR(`/api/reservations?${query}`, fetcher, {
    revalidateOnFocus: false,
  });
}

export function useNotifications() {
  useCirculationSync();
  return useSWR("/api/notifications", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });
}
