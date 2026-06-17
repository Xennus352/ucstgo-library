"use client";

import { fetcher } from "@/lib/fetcher";
import { User } from "@/types/UserType";
import useSWR from "swr";

function normalizeUser(data: any): User | undefined {
  if (!data) return undefined;

  return {
    ...data,
    createdAt: data.createdAt ? new Date(data.createdAt) : null,
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
  };
}

export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR("/api/me", fetcher);

  return {
    user: normalizeUser(data),
    isLoading,
    error,
    refreshUser: mutate,
  };
}
