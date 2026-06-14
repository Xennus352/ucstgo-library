import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => res.json());

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