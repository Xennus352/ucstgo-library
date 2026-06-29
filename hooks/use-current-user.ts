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
  const { data, error, isLoading, mutate } = useSWR("/api/me", fetcher, {
    // 🚫 Stop retrying if the user is unauthenticated
    onErrorRetry: (err, key, config, revalidate, { retryCount }) => {
      // If the API helper returns a 401 status, do not try again
      if (err.status === 401) return;

      // Otherwise, cap standard retries at 3 times
      if (retryCount >= 3) return;

      // Retry after a standard delay
      setTimeout(() => revalidate({ retryCount }), 5000);
    },
    revalidateOnFocus: false, // Prevents spamming /api/me whenever a guest clicks back onto the tab
    shouldRetryOnError: false, // Global stop on fast error-looping for guest profiles
  });

  return {
    user: normalizeUser(data),
    isLoading,
    error,
    refreshUser: mutate,
  };
}
