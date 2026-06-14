
import useSWR from "swr";
import useSWRMutation from "swr/mutation";
import { useCallback, useMemo } from "react";
import { User } from "@/types/UserType";
import { toast } from "sonner";

interface LibrariansResponse {
  data: User[];
  meta: {
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

interface MutationPayload {
  name: string;
  email: string;
  phone?: string;
  password?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch librarians");
  return res.json();
};

const createLibrarian = async (url: string, { arg }: { arg: MutationPayload }) => {
  const res = await fetch("/api/admin/librarians", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg),
  });
  if (!res.ok) throw new Error("Failed to create librarian");
  return res.json();
};

const updateLibrarian = async (url: string, { arg }: { arg: { id: string; data: Partial<MutationPayload> } }) => {
  const res = await fetch(`/api/admin/librarians/${arg.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(arg.data),
  });
  if (!res.ok) throw new Error("Failed to update librarian");
  return res.json();
};

const deleteLibrarian = async (url: string, { arg }: { arg: string }) => {
  const res = await fetch(`/api/admin/librarians/${arg}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete librarian");
  return res.json();
};

const bulkDeleteLibrarians = async (url: string, { arg }: { arg: string[] }) => {
  const res = await fetch("/api/admin/librarians/bulk-delete", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: arg }),
  });
  if (!res.ok) throw new Error("Failed to bulk delete librarians");
  return res.json();
};

const bulkImportLibrarians = async (url: string, { arg }: { arg: any[] }) => {
  const res = await fetch("/api/admin/librarians/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ librarians: arg }),
  });
  if (!res.ok) throw new Error("Failed to import librarians");
  return res.json();
};

export function useLibrarians(page: number, limit: number, search: string) {
  // Stable cache key for SWR
  const cacheKey = useMemo(
    () => `/api/admin/librarians?page=${page}&limit=${limit}&search=${search}&role=LIBRARIAN`,
    [page, limit, search]
  );

  const { data, error, isLoading, isValidating, mutate } = useSWR<LibrariansResponse>(
    cacheKey,
    fetcher,
    {
      keepPreviousData: true, // Keep old data while loading new
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Dedupe requests within 2 seconds
      refreshInterval: 0, // No auto-refresh
    }
  );

  // Mutations
  const { trigger: createTrigger, isMutating: isCreating } = useSWRMutation(
    cacheKey,
    createLibrarian
  );

  const { trigger: updateTrigger, isMutating: isUpdating } = useSWRMutation(
    cacheKey,
    updateLibrarian
  );

  const { trigger: deleteTrigger, isMutating: isDeleting } = useSWRMutation(
    cacheKey,
    deleteLibrarian
  );

  const { trigger: bulkDeleteTrigger, isMutating: isBulkDeleting } = useSWRMutation(
    cacheKey,
    bulkDeleteLibrarians
  );

  const { trigger: bulkImportTrigger, isMutating: isImporting } = useSWRMutation(
    cacheKey,
    bulkImportLibrarians
  );

  // Optimistic create
  const createLibrarianOptimistic = useCallback(
  async (newLibrarian: MutationPayload) => {
    // Ensure we have current meta, or fall back to default values
    const currentMeta = data?.meta || { total: 0, page: page, limit: limit, totalPages: 1 };
    
    const optimisticData: LibrariansResponse = {
      data: [
        { id: `temp-${Date.now()}`, ...newLibrarian, createdAt: new Date(), role: "LIBRARIAN" } as User,
        ...(data?.data || []),
      ],
      meta: { 
        ...currentMeta, 
        total: currentMeta.total + 1 
      },
    };

    try {
      await mutate(createTrigger(newLibrarian), {
        optimisticData,
        rollbackOnError: true,
        // Inside createLibrarianOptimistic
populateCache: (result: any, currentData) => ({
  ...currentData!,
  // result is the single new user, wrap it in an array
  data: [result, ...(currentData?.data || [])], 
  meta: { 
    ...currentData!.meta, 
    total: (currentData!.meta.total || 0) + 1 
  },
}),
        revalidate: false,
      });
      // ... rest of the code
        toast.success("Librarian created successfully");
        return true;
      } catch (error: any) {
        toast.error(error.message);
        return false;
      }
    },
    [data, mutate, createTrigger]
  );

  // Optimistic update
  const updateLibrarianOptimistic = useCallback(
    async (id: string, updatedData: Partial<MutationPayload>) => {
      const optimisticData = {
        ...data,
        data: data?.data.map((librarian) =>
          librarian.id === id ? { ...librarian, ...updatedData } : librarian
        ),
      };

      try {
        await mutate(updateTrigger({ id, data: updatedData }), {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        });
        toast.success("Librarian updated successfully");
        return true;
      } catch (error: any) {
        toast.error(error.message);
        return false;
      }
    },
    [data, mutate, updateTrigger]
  );

  // Optimistic delete
  const deleteLibrarianOptimistic = useCallback(
    async (id: string, name: string) => {
      const optimisticData = {
        ...data,
        data: data?.data.filter((librarian) => librarian.id !== id),
        meta: { ...data?.meta, total: (data?.meta.total || 0) - 1 },
      };

      try {
        await mutate(deleteTrigger(id), {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        });
        toast.success(`${name} removed successfully`);
        return true;
      } catch (error: any) {
        toast.error(error.message);
        return false;
      }
    },
    [data, mutate, deleteTrigger]
  );

  // Bulk delete
  const bulkDeleteOptimistic = useCallback(
    async (ids: string[]) => {
      const optimisticData = {
        ...data,
        data: data?.data.filter((librarian) => !ids.includes(librarian.id)),
        meta: { ...data?.meta, total: (data?.meta.total || 0) - ids.length },
      };

      try {
        await mutate(bulkDeleteTrigger(ids), {
          optimisticData,
          rollbackOnError: true,
          revalidate: false,
        });
        toast.success(`Successfully removed ${ids.length} librarian records`);
        return true;
      } catch (error: any) {
        toast.error(error.message);
        return false;
      }
    },
    [data, mutate, bulkDeleteTrigger]
  );

  // Bulk import
  const bulkImportOptimistic = useCallback(
    async (librarians: any[]) => {
      const optimisticData = {
        ...data,
        data: [...librarians.map(l => ({ ...l, id: `temp-${Date.now()}-${Math.random()}` })), ...(data?.data || [])],
        meta: { ...data?.meta, total: (data?.meta.total || 0) + librarians.length },
      };

      try {
        await mutate(bulkImportTrigger(librarians), {
          optimisticData,
          rollbackOnError: true,
          revalidate: true,
        });
        toast.success(`Successfully imported ${librarians.length} records`);
        return true;
      } catch (error: any) {
        toast.error(error.message);
        return false;
      }
    },
    [data, mutate, bulkImportTrigger]
  );

  // Refresh data
  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  return {
    librarians: data?.data || [],
    totalRecords: data?.meta?.total || 0,
    isLoading: isLoading && !data, // Only show loading on first load
    isValidating, // Background revalidation indicator
    error,
    refresh,
    createLibrarian: createLibrarianOptimistic,
    updateLibrarian: updateLibrarianOptimistic,
    deleteLibrarian: deleteLibrarianOptimistic,
    bulkDelete: bulkDeleteOptimistic,
    bulkImport: bulkImportOptimistic,
    isMutating: isCreating || isUpdating || isDeleting || isBulkDeleting || isImporting,
  };
}
