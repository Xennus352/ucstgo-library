import useSWR, { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import { fetcher } from "@/lib/fetcher";

export type CatalogEntity = "category" | "author";

export type CatalogItem = {
  id: string;
  name: string;
  _count?: {
    books?: number;
  };
};

export function catalogEndpoint(entity: CatalogEntity) {
  return `/api/admin/${entity === "category" ? "categories" : "authors"}`;
}

export function useCatalogList(
  entity: CatalogEntity,
  params?: { page?: number; q?: string; limit?: number },
) {
  const query = new URLSearchParams(
    Object.entries(params || {}).filter(([, v]) => v !== undefined) as [
      string,
      string,
    ][],
  ).toString();

  return useSWR<{
    data: CatalogItem[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }>(`${catalogEndpoint(entity)}?${query}`, fetcher, {
    revalidateOnFocus: false,
  });
}

export function useCatalogMutation(
  entity: CatalogEntity,
  id?: string,
) {
  return useSWRMutation(
    id ? `${catalogEndpoint(entity)}/${id}` : catalogEndpoint(entity),
    (url, { arg }: { arg: { name: string } }) =>
      fetch(url, {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(arg),
      }).then((r) => r.json()),
  );
}

export function useCatalogDelete(entity: CatalogEntity) {
  const { mutate } = useSWRConfig();

  return useSWRMutation(
    catalogEndpoint(entity),
    (url, { arg }: { arg: { id: string } }) =>
      fetch(`${url}/${arg.id}`, { method: "DELETE" }).then((r) => r.json()),
    {
      onSuccess: () => {
        mutate(
          (key) =>
            typeof key === "string" &&
            key.startsWith(catalogEndpoint(entity)),
        );
      },
    },
  );
}
