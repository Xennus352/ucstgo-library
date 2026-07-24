import useSWR, { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";
import { useSocketEvent } from "@/hooks/use-socket";

function useUserSync() {
  const { mutate } = useSWRConfig();
  useSocketEvent("user:changed", () => {
    mutate((key) => typeof key === "string" && key.startsWith("/api/admin/"));
  });
  useSocketEvent("user:banned", () => {
    mutate((key) => typeof key === "string" && key.startsWith("/api/admin/"));
  });
}

type UserRole = "STUDENT" | "LIBRARIAN" | "TEACHER";

function userEndpoint(role: UserRole) {
  return `/api/admin/${role.toLowerCase()}s`;
}

export function useUserList(role: UserRole, params?: { page?: number; q?: string }) {
  useUserSync();
  const query = new URLSearchParams(
    Object.entries(params || {}).filter(([_, v]) => v !== undefined) as [string, string][],
  ).toString();
  return useSWR(`${userEndpoint(role)}?${query}`, fetcher, {
    revalidateOnFocus: false,
  });
}

export function useCreateUser(role: UserRole) {
  return useSWRMutation(
    userEndpoint(role),
    (url, { arg }: { arg: FormData | Record<string, unknown> }) =>
      fetch(url, {
        method: "POST",
        body: arg instanceof FormData ? arg : JSON.stringify(arg),
        headers: arg instanceof FormData ? {} : { "Content-Type": "application/json" },
      }).then((r) => r.json()),
  );
}

export function useUpdateUser(role: UserRole, id: string) {
  return useSWRMutation(
    `${userEndpoint(role)}/${id}`,
    (url, { arg }: { arg: Record<string, unknown> }) =>
      fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      }).then((r) => r.json()),
  );
}

export function useDeleteUser(role: UserRole) {
  return useSWRMutation(
    userEndpoint(role),
    (url, { arg }: { arg: { id: string } }) =>
      fetch(`${url}/${arg.id}`, { method: "DELETE" }).then((r) => r.json()),
  );
}
