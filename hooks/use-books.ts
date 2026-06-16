import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";


export function useBooks(query: string) {
  return useSWR(
    `/api/books?search=${query}`,
    fetcher,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  );
}