"use client";

import * as React from "react";
import {
  SearchIcon,
  PlusIcon,
  Edit2Icon,
  Trash2Icon,
  Loader2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  X,
  ShieldAlert,
  CheckCircleIcon,
  FolderOpenIcon,
  UserRoundIcon,
  TagIcon,
  AlertCircleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  CatalogEntity,
  CatalogItem,
  useCatalogList,
  useCatalogMutation,
  useCatalogDelete,
} from "@/features/catalog/hooks/use-catalog-management";

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const getApiError = (data: { error?: unknown }, fallback: string) =>
  typeof data?.error === "string" ? data.error : fallback;

const entityLabels: Record<
  CatalogEntity,
  { singular: string; plural: string; icon: React.ReactNode; accent: string }
> = {
  category: {
    singular: "Category",
    plural: "Categories",
    icon: <FolderOpenIcon className="w-6 h-6" />,
    accent: "from-blue-500 to-indigo-600",
  },
  author: {
    singular: "Author",
    plural: "Authors",
    icon: <UserRoundIcon className="w-6 h-6" />,
    accent: "from-purple-500 to-fuchsia-600",
  },
};

function NameForm({
  entity,
  itemToEdit,
  onSuccess,
  onCancel,
}: {
  entity: CatalogEntity;
  itemToEdit?: CatalogItem | null;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = React.useState(itemToEdit?.name ?? "");
  const [touched, setTouched] = React.useState(false);
  const [error, setError] = React.useState("");
  const { trigger, isMutating } = useCatalogMutation(entity, itemToEdit?.id);
  const { singular, accent } = entityLabels[entity];
  const isEditMode = !!itemToEdit;

  const validate = (value: string) => {
    if (!value.trim()) return `${singular} name is required`;
    if (value.trim().length < 2)
      return `${singular} name must be at least 2 characters`;
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate(name);
    if (validationError) {
      setError(validationError);
      setTouched(true);
      return;
    }

    try {
      const res = await trigger({ name: name.trim() });
      if (res?.error) {
        throw new Error(getApiError(res, `Failed to save ${singular.toLowerCase()}`));
      }

      toast.success(
        isEditMode
          ? `${singular} updated successfully`
          : `${singular} created successfully`,
      );
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to save ${singular.toLowerCase()}`));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center pb-2">
        <div
          className={`mx-auto w-12 h-12 bg-gradient-to-br ${accent} rounded-xl flex items-center justify-center mb-3 shadow-lg`}
        >
          {entityLabels[entity].icon}
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {isEditMode ? `Edit ${singular}` : `Add New ${singular}`}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isEditMode
            ? `Update the ${singular.toLowerCase()} name`
            : `Create a new ${singular.toLowerCase()} for the book catalog`}
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {singular} Name *
        </label>
        <div className="relative">
          <TagIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            name="name"
            type="text"
            placeholder={
              entity === "category"
                ? "e.g., Computer Science, Fiction"
                : "e.g., J.R.R. Tolkien, Chinua Achebe"
            }
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (touched) setError(validate(e.target.value));
            }}
            onBlur={() => {
              setTouched(true);
              setError(validate(name));
            }}
            className={`w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-slate-900 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
              touched && error
                ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
                : "border-slate-200 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500"
            }`}
          />
        </div>
        {touched && error && (
          <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
            <AlertCircleIcon className="w-3 h-3" />
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 px-4 rounded-lg font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition-all duration-200 active:scale-[0.98] dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isMutating}
          className={`flex-1 bg-gradient-to-r ${accent} hover:opacity-90 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md active:scale-[0.98]`}
        >
          {isMutating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Saving...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <CheckCircleIcon className="w-4 h-4" />
              {isEditMode ? `Update ${singular}` : `Create ${singular}`}
            </span>
          )}
        </button>
      </div>
    </form>
  );
}

export function CatalogManager({
  entity,
}: {
  entity: CatalogEntity;
}) {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<CatalogItem | null>(null);
  const [deleteItem, setDeleteItem] = React.useState<CatalogItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const { singular, plural } = entityLabels[entity];

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, mutate } = useCatalogList(entity, {
    page,
    limit: pageSize,
    q: debouncedSearch || undefined,
  });

  const { trigger: deleteTrigger } = useCatalogDelete(entity);

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages || 1;

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      setIsDeleting(true);
      const res = await deleteTrigger({ id: deleteItem.id });
      if (res?.error) {
        throw new Error(getApiError(res, `Failed to delete ${singular.toLowerCase()}`));
      }
      toast.success(`${deleteItem.name} removed successfully`);
      setDeleteItem(null);
      mutate();
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to delete ${singular.toLowerCase()}`));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/40 bg-white/70 backdrop-blur-md shadow-xs p-6 space-y-4 dark:bg-slate-900/60 dark:border-slate-800/40">
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={`Search ${plural.toLowerCase()}...`}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 dark:border-slate-800"
          />
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium shadow-sm transition-all cursor-pointer"
        >
          <PlusIcon className="size-4" />
          <span>Add {singular}</span>
        </button>
      </div>

      <ResponsiveDrawer
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title={`Register ${singular}`}
      >
        <div className="pt-4">
          <NameForm
            entity={entity}
            onSuccess={() => {
              setIsCreateOpen(false);
              mutate();
            }}
            onCancel={() => setIsCreateOpen(false)}
          />
        </div>
      </ResponsiveDrawer>

      <ResponsiveDrawer
        open={editingItem !== null}
        onOpenChange={(val) => !val && setEditingItem(null)}
        title={`Modify ${singular} Record`}
      >
        <div className="pt-4">
          <NameForm
            key={editingItem?.id ?? "create"}
            entity={entity}
            itemToEdit={editingItem}
            onSuccess={() => {
              setEditingItem(null);
              mutate();
            }}
            onCancel={() => setEditingItem(null)}
          />
        </div>
      </ResponsiveDrawer>

      <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 dark:bg-slate-900/40 text-slate-500 font-semibold text-xs tracking-wider uppercase">
              <th className="p-4">{singular} Name</th>
              <th className="p-4">ID</th>
              <th className="p-4 text-center">Linked Books</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-12 text-center">
                  <Loader2Icon className="size-6 animate-spin text-blue-500 mx-auto" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-12 text-center text-slate-400">
                  No {plural.toLowerCase()} found.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-white/50 dark:hover:bg-slate-900/30 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-9 rounded-lg bg-gradient-to-br ${
                          entityLabels[entity].accent
                        } flex items-center justify-center text-white text-sm shadow-sm`}
                      >
                        {item.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-[11px] font-mono text-slate-400">
                    {item.id.substring(0, 8)}
                  </td>
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                      {item._count?.books ?? 0}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Edit Properties"
                      >
                        <Edit2Icon className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteItem(item)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete Record"
                      >
                        <Trash2Icon className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-2 text-xs text-slate-500 font-medium">
        <span>
          Showing{" "}
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {items.length}
          </span>{" "}
          of <span className="font-mono">{total}</span> {plural.toLowerCase()}
        </span>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1 || isLoading}
            className="p-1.5 border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <span className="px-2 font-mono whitespace-nowrap">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || isLoading}
            className="p-1.5 border-slate-200 dark:border-slate-800 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(open) => {
          if (!open) setDeleteItem(null);
        }}
      >
        <AlertDialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-0 shadow-2xl transition-all dark:bg-slate-900 dark:border-slate-800">
          <div className="relative h-2 bg-linear-to-r from-rose-500 to-amber-500" />
          <AlertDialogCancel className="absolute right-4 top-5 border-0 bg-transparent p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full cursor-pointer transition-colors dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </AlertDialogCancel>

          <div className="p-6 pt-8">
            <AlertDialogHeader className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shadow-sm dark:bg-rose-950/40 dark:border-rose-900/40">
                <ShieldAlert className="h-8 w-8 animate-pulse text-rose-500" />
              </div>
              <div className="space-y-1.5 text-center">
                <AlertDialogTitle className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Permanently delete {singular.toLowerCase()}?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 px-4">
                  You are initiating a destructive action to remove{" "}
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                    {deleteItem?.name}
                  </span>{" "}
                  from the database.
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>

            <div className="mt-6 rounded-xl bg-amber-50/60 border border-amber-200/60 p-4 text-xs text-amber-800 flex gap-3 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400">
              <div className="font-semibold uppercase tracking-wider bg-amber-200/70 px-1.5 py-0.5 rounded h-fit text-[10px] dark:bg-amber-900/40">
                Warning
              </div>
              <p className="flex-1 leading-normal">
                This action is completely{" "}
                <strong className="font-bold">irreversible</strong>. {singular}s
                still linked to books cannot be deleted.
              </p>
            </div>

            <AlertDialogFooter className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <AlertDialogCancel className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition-all duration-200 active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700">
                Keep {singular}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-white shadow-md shadow-rose-200/50 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-70 disabled:pointer-events-none cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 dark:shadow-none"
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2Icon className="h-4 w-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
