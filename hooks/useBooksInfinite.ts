"use client";

import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/fetcher";
import { transformApiBooks } from "@/utils/dataAdapter";
import { BookWithDetails } from "@/components/students/types";
import { useSocketEvent } from "@/hooks/use-socket";

type BookType = "all" | "EResources" | "physical";

const PAGE_SIZE = 50;

export function useBooksInfinite(type: BookType) {
  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData?.pagination?.hasNextPage)
      return null;

    return `/api/books?page=${pageIndex + 1}&limit=${PAGE_SIZE}&type=${type}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite(getKey, fetcher);

  useSocketEvent("catalog:created", () => mutate());
  useSocketEvent("catalog:updated", () => mutate());
  useSocketEvent("catalog:deleted", () => mutate());

  const books: BookWithDetails[] = data
    ? data.flatMap((page) => {
        if (!page?.success || !Array.isArray(page.data)) return [];
        return transformApiBooks(page.data);
      })
    : [];

  const hasMore =
    data?.[data.length - 1]?.pagination?.hasNextPage ?? false;

  return {
    books,
    isLoading,
    isValidating,
    error,
    size,
    setSize,
    mutate,
    hasMore,
  };
}
