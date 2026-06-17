"use client";

import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/fetcher";
import { transformApiBooks } from "@/utils/dataAdapter";
import { BookWithDetails } from "@/components/students/types";

type BookType = "all" | "ebook" | "physical";

const PAGE_SIZE = 20;

export function useBooksInfinite(type: BookType) {
  const getKey = (pageIndex: number, previousPageData: any) => {
    // stop when no more data
    if (previousPageData && previousPageData.data?.length === 0) return null;

    return `/api/books?page=${pageIndex + 1}&limit=${PAGE_SIZE}&type=${type}`;
  };

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite(
    getKey,
    fetcher,
    {
      revalidateFirstPage: false,
    },
  );

  const books: BookWithDetails[] = data
    ? data.flatMap((page) => {
        if (!page?.success || !Array.isArray(page.data)) return [];
        return transformApiBooks(page.data);
      })
    : [];

  const hasMore = data?.[data.length - 1]?.data?.length === PAGE_SIZE;

  return {
    books,
    isLoading,
    error,
    size,
    setSize,
    mutate,
    hasMore,
  };
}
