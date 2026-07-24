import useSWR, { useSWRConfig } from "swr";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/fetcher";
import { useSocketEvent } from "@/hooks/use-socket";

function useCatalogSync() {
  const { mutate } = useSWRConfig();
  useSocketEvent("catalog:created", () => {
    mutate((key) => typeof key === "string" && key.startsWith("/api/books"));
  });
  useSocketEvent("catalog:updated", () => {
    mutate((key) => typeof key === "string" && key.startsWith("/api/books"));
  });
  useSocketEvent("catalog:deleted", () => {
    mutate((key) => typeof key === "string" && key.startsWith("/api/books"));
  });
}

export type BookFilterParams = {
  q?: string;
  categoryId?: string;
  status?: string;
  type?: string;
  semester?: string;
};

export type BookListParams = BookFilterParams & {
  page?: number;
  limit?: number;
};

export function useBookSearch(params: BookListParams = {}) {
  useCatalogSync();
  const query = new URLSearchParams(
    Object.entries(params).filter(
      ([_, v]) => v !== undefined && v !== null && v !== "",
    ) as [string, string][],
  ).toString();

  return useSWR(`/api/books?${query}`, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    fallbackData: { data: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } },
  });
}

export function useBookInfinite(params: BookFilterParams) {
  useCatalogSync();
  const getKey = (pageIndex: number, previousPage: any) => {
    if (previousPage && !previousPage.pagination?.hasNextPage) return null;
    const query = new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v && v !== "all"),
      ),
      page: String(pageIndex + 1),
      limit: "20",
    }).toString();
    return `/api/books?${query}`;
  };

  return useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    revalidateOnFocus: false,
  });
}

export function useBook(id: string | undefined) {
  useCatalogSync();
  return useSWR(id ? `/api/books/${id}` : null, fetcher, {
    revalidateOnFocus: false,
  });
}

export function useCategories() {
  useCatalogSync();
  return useSWR("/api/books/categories", fetcher, {
    revalidateOnFocus: false,
  });
}
