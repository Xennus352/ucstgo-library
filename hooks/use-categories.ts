import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";

export function useCategories() {
  return useSWR("/api/books/categories", fetcher, {
    revalidateOnFocus: false,
  });
}
