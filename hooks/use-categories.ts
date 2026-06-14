import useSWR from "swr";
import { fetcher } from "./use-authors";

export function useCategories() {
  return useSWR("/api/categories", fetcher, {
    revalidateOnFocus: false,
  });
}