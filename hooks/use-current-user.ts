"use client";

import useSWR from "swr";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json();
  });

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR("/api/me", fetcher);

  return {
    user: data,
    isLoading,
    error,
    refreshUser: mutate,
  };
}