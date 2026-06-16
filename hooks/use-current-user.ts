"use client";

import { fetcher } from "@/lib/fetcher";
import useSWR from "swr";



export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR("/api/me", fetcher);

  return {
    user: data,
    isLoading,
    error,
    refreshUser: mutate,
  };
}