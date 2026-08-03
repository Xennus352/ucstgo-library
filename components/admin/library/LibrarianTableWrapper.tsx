"use client";

import * as React from "react";
import {
  SearchIcon,
  PlusIcon,
  MailIcon,
  CalendarIcon,
  PhoneIcon,
  FileSpreadsheetIcon,
  UploadCloudIcon,
  Trash2Icon,
  CheckIcon,
  Edit2Icon,
  Loader2Icon,
  Ban,
  ShieldCheck,
  ShieldAlert,
  Download,
} from "lucide-react";
import { BookPagination } from "@/components/books/BookPagination";
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
import { Trash2, X } from "lucide-react";
import { User } from "@/types/UserType";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import CreateLibrarianForm from "../library/librarian-create-librarian-form";
import { SAMPLE_ZIP_LIBRARIAN_PATH } from "@/constants/sampleData";

type EditableImportRow = {
  _localKey: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
};

type LibrariansResponse = {
  data?: User[];
  meta?: {
    total?: number;
  };
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const stringValue = (value: unknown) =>
  typeof value === "string" ? value : value == null ? "" : String(value);

export function LibrarianTableWrapper() {
  const [librarians, setLibrarians] = React.useState<User[]>([]);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const [deleteLibrarian, setDeleteLibrarian] = React.useState<User | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [selectedLibrarians, setSelectedLibrarians] = React.useState<User[]>(
    [],
  );
  const [showBulkDeleteAlert, setShowBulkDeleteAlert] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [editingLibrarian, setEditingLibrarian] = React.useState<User | null>(
    null,
  );

  const [previewRows, setPreviewRows] = React.useState<EditableImportRow[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isImporting, setIsImporting] = React.useState(false);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchLibrarians = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: debouncedSearch,
        role: "LIBRARIAN",
      });
      const res = await fetch(
        `/api/admin/librarians?${queryParams.toString()}`,
      );
      if (!res.ok) throw new Error("Failed to pull librarian records.");
      const payload = (await res.json()) as LibrariansResponse;

      setLibrarians(payload.data ?? []);
      setTotalRecords(payload.meta?.total ?? 0);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Network read failure."));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchLibrarians();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchLibrarians]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchLibrarians();
    toast.success("Librarian profile instantiated into directory.");
  };

  const handleUpdateSuccess = () => {
    setEditingLibrarian(null);
    fetchLibrarians();
    toast.success("Librarian record properties updated successfully.");
  };

  const handleDeleteRecord = async () => {
    if (!deleteLibrarian) return;

    try {
      setIsDeleting(true);

      const res = await fetch(`/api/admin/librarians/${deleteLibrarian.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete librarian.");
      }

      toast.success(`${deleteLibrarian.name} removed successfully.`);
      setDeleteLibrarian(null);

      setSelectedLibrarians((prev) =>
        prev.filter((s) => s.id !== deleteLibrarian.id),
      );

      fetchLibrarians();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete librarian."));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDeleteRecords = async () => {
    if (selectedLibrarians.length === 0) return;

    try {
      setIsBulkDeleting(true);

      const res = await fetch("/api/admin/librarians/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedLibrarians.map((librarian) => librarian.id),
        }),
      });

      if (!res.ok) {
        throw new Error("Bulk deletion process encountered an error.");
      }

      toast.success(
        `Successfully removed ${selectedLibrarians.length} librarian records.`,
      );
      setSelectedLibrarians([]);
      setShowBulkDeleteAlert(false);
      fetchLibrarians();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Bulk deletion failed."));
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExcelParse = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData =
          XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        setPreviewRows(
          rawData.map((row, idx) => ({
            _localKey: `draft-${Date.now()}-${idx}`,
            name: stringValue(row.Name ?? row.name),
            email: stringValue(row.Email ?? row.email),
            phone: stringValue(row.Phone ?? row.phone),
            password: stringValue(row.Password ?? row.password),
          })),
        );
      } catch {
        toast.error("Unreadable spreadsheet file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCellEdit = (
    localKey: string,
    field: keyof EditableImportRow,
    value: string,
  ) => {
    setPreviewRows((prev) =>
      prev.map((row) =>
        row._localKey === localKey ? { ...row, [field]: value } : row,
      ),
    );
  };

  const handleCommitImport = async () => {
    const validRows = previewRows.filter(
      (row) => row.name.trim().length > 0 && row.email.includes("@"),
    );

    if (validRows.length === 0) {
      toast.error("Staging is empty or contains invalid librarian rows.");
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch("/api/admin/librarians/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ librarians: validRows }),
      });

      if (!res.ok) throw new Error("Bulk ingestion transaction refused.");

      toast.success(
        `Successfully batch initialized ${validRows.length} active records.`,
      );
      setPreviewRows([]);
      setIsImportOpen(false);
      fetchLibrarians();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Batch commit fault."));
    } finally {
      setIsImporting(false);
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

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
            placeholder="Search librarian records..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 dark:border-slate-800"
          />
        </div>

        <div className="flex w-full lg:w-auto items-center gap-2 justify-end">
          {selectedLibrarians.length > 0 && (
            <button
              onClick={() => setShowBulkDeleteAlert(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/40 px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <Trash2Icon className="size-4" />
              <span>Delete Selected ({selectedLibrarians.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/40 px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer"
          >
            <FileSpreadsheetIcon className="size-4" />
            <span>Import Excel</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium shadow-sm transition-all cursor-pointer"
          >
            <PlusIcon className="size-4" />
            <span>Add Librarian</span>
          </button>
        </div>
      </div>

      <ResponsiveDrawer
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Register Librarian Account"
      >
        <CreateLibrarianForm onLibrarianCreated={handleCreateSuccess} />
      </ResponsiveDrawer>

      <ResponsiveDrawer
        open={editingLibrarian !== null}
        onOpenChange={(val) => !val && setEditingLibrarian(null)}
        title="Modify Librarian Record"
      >
        {editingLibrarian && (
          <CreateLibrarianForm
            librarianToEdit={editingLibrarian}
            onLibrarianCreated={handleUpdateSuccess}
          />
        )}
      </ResponsiveDrawer>

      <ResponsiveDrawer
        open={isImportOpen}
        onOpenChange={(v) => {
          setIsImportOpen(v);
          if (!v) setPreviewRows([]);
        }}
        title="Bulk Spreadsheet Workspace"
      >
        <div className="space-y-4 pt-4">
          {/* Sample Download Banner (Only shows when no data is parsed yet) */}
          {previewRows.length === 0 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between gap-4">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Need a template? Download our sample format structure.
              </div>
              <a
                href={SAMPLE_ZIP_LIBRARIAN_PATH}
                 download="sample_librarians.zip"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Sample.zip
              </a>
            </div>
          )}

          {previewRows.length === 0 ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleExcelParse(f);
              }}
              className={`group flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${isDragging ? "border-blue-500 bg-blue-50/20" : "border-slate-200 hover:border-emerald-500 bg-slate-50/50"}`}
            >
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleExcelParse(f);
                }}
                className="hidden"
              />
              <UploadCloudIcon className="size-12 text-slate-400 mb-2" />
              <span className="text-sm font-semibold">
                Drop spreadsheet layout directory or click to browse
              </span>
            </label>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="overflow-x-auto rounded-lg border max-h-[40vh]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 sticky top-0 border-b font-bold">
                    <tr>
                      <th className="p-2">Full Name</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Password</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row) => (
                      <tr key={row._localKey}>
                        <td className="p-1">
                          <input
                            type="text"
                            value={row.name}
                            onChange={(e) =>
                              handleCellEdit(
                                row._localKey,
                                "name",
                                e.target.value,
                              )
                            }
                            className="w-full p-1 bg-transparent border rounded"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={row.email}
                            onChange={(e) =>
                              handleCellEdit(
                                row._localKey,
                                "email",
                                e.target.value,
                              )
                            }
                            className="w-full p-1 bg-transparent border rounded"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={row.phone}
                            onChange={(e) =>
                              handleCellEdit(
                                row._localKey,
                                "phone",
                                e.target.value,
                              )
                            }
                            className="w-full p-1 bg-transparent border rounded"
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            value={row.password || ""}
                            placeholder="Fallback used if blank"
                            onChange={(e) =>
                              handleCellEdit(
                                row._localKey,
                                "password",
                                e.target.value,
                              )
                            }
                            className="w-full p-1 bg-transparent border rounded font-mono text-[11px]"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setPreviewRows([])}
                  className="text-xs text-slate-500 mr-4"
                >
                  Reset
                </button>
                <button
                  onClick={handleCommitImport}
                  disabled={isImporting}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <><CheckIcon className="size-4" /> Save Uploaded Sheet</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </ResponsiveDrawer>

      <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 dark:bg-slate-900/40 text-slate-500 font-semibold text-xs tracking-wider uppercase">
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  className="cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={
                    librarians.length > 0 &&
                    selectedLibrarians.length === librarians.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLibrarians(librarians);
                    } else {
                      setSelectedLibrarians([]);
                    }
                  }}
                />
              </th>
              <th className="p-4">Librarian Profile</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">Access Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <Loader2Icon className="size-6 animate-spin text-blue-500 mx-auto" />
                </td>
              </tr>
            ) : librarians.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center text-slate-400">
                  No active librarian records located.
                </td>
              </tr>
            ) : (
              librarians.map((librarian) => (
                <tr
                  key={librarian.id}
                  className={`hover:bg-white/50 dark:hover:bg-slate-900/30 transition-colors group ${
                    selectedLibrarians.some((s) => s.id === librarian.id)
                      ? "bg-slate-50/60 dark:bg-slate-900/20"
                      : ""
                  }`}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      className="cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedLibrarians.some(
                        (s) => s.id === librarian.id,
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLibrarians((prev) => [...prev, librarian]);
                        } else {
                          setSelectedLibrarians((prev) =>
                            prev.filter((s) => s.id !== librarian.id),
                          );
                        }
                      }}
                    />
                  </td>
                  <td className="p-4 flex items-center gap-3">
                    <div className="size-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500">
                      {librarian.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {librarian.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-25">
                        id: {librarian.id.substring(0, 8)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-xs space-y-0.5 text-slate-500">
                    <span className="flex items-center gap-1">
                      <MailIcon className="size-3" /> {librarian.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <PhoneIcon className="size-3" />{" "}
                      {librarian.phone || "N/A"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <CalendarIcon className="size-3" /> Joined:{" "}
                      {new Date(librarian.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-4">
                    {librarian.banned ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-full">
                        <Ban className="size-3.5" /> Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-full">
                        <ShieldCheck className="size-3.5" /> Admin Access
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setEditingLibrarian(librarian)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Edit Properties"
                      >
                        <Edit2Icon className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteLibrarian(librarian)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete Profile"
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

      <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-500 font-medium">
        <span>
          Showing records{" "}
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {librarians.length}
          </span>{" "}
          of <span className="font-mono">{totalRecords}</span> values
        </span>
                <BookPagination
          page={page}
          totalPages={totalPages}
          hasNextPage={page < totalPages}
          isLoading={isLoading}
          onPageChange={setPage}
        />
      </div>

      <AlertDialog
        open={!!deleteLibrarian}
        onOpenChange={(open) => {
          if (!open) setDeleteLibrarian(null);
        }}
      >
        <AlertDialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-0 shadow-2xl transition-all">
          <div className="relative h-2 bg-linear-to-r from-rose-500 to-amber-500" />
          <AlertDialogCancel className="absolute right-4 top-5 border-0 bg-transparent p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full cursor-pointer transition-colors">
            <X className="h-4 w-4" />
          </AlertDialogCancel>

          <div className="p-6 pt-8">
            <AlertDialogHeader className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shadow-sm">
                <ShieldAlert className="h-8 w-8 animate-pulse text-rose-500" />
              </div>
              <div className="space-y-1.5 text-center">
                <AlertDialogTitle className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Permanently delete librarian?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-slate-500 px-4">
                  You are initiating a destructive action to remove{" "}
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-800 border border-slate-200">
                    {deleteLibrarian?.name}
                  </span>{" "}
                  from the database.
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>

            <div className="mt-6 rounded-xl bg-amber-50/60 border border-amber-200/60 p-4 text-xs text-amber-800 flex gap-3">
              <div className="font-semibold uppercase tracking-wider bg-amber-200/70 px-1.5 py-0.5 rounded h-fit text-[10px]">
                Warning
              </div>
              <p className="flex-1 leading-normal">
                This action is completely{" "}
                <strong className="font-bold">irreversible</strong>. The The
                librarian access logs and profile will be wiped instantly.
              </p>
            </div>

            <AlertDialogFooter className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100 pt-4">
              <AlertDialogCancel className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition-all duration-200 active:scale-95">
                Keep Librarian
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteRecord}
                disabled={isDeleting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-white shadow-md shadow-rose-200/50 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-70 disabled:pointer-events-none cursor-pointer transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Purging Data...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showBulkDeleteAlert}
        onOpenChange={setShowBulkDeleteAlert}
      >
        <AlertDialogContent className="max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white p-0 shadow-2xl transition-all dark:bg-slate-900 dark:border-slate-800">
          <div className="relative h-2 bg-linear-to-r from-rose-600 to-red-500" />
          <AlertDialogCancel className="absolute right-4 top-5 border-0 bg-transparent p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-full cursor-pointer transition-colors dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </AlertDialogCancel>

          <div className="p-6 pt-8">
            <AlertDialogHeader className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 shadow-sm dark:bg-rose-950/40 dark:border-rose-900/40">
                <Trash2Icon className="h-8 w-8 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="space-y-1.5 text-center">
                <AlertDialogTitle className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Delete {selectedLibrarians.length} Profiles?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 px-4">
                  You are preparing to wipe a batch of chosen directory rows
                  simultaneously. This will impact multiple librarian accounts.
                </AlertDialogDescription>
              </div>
            </AlertDialogHeader>

            <div className="mt-6 rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-red-800 flex gap-3 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400">
              <div className="font-semibold uppercase tracking-wider bg-red-200 px-1.5 py-0.5 rounded h-fit text-[10px] dark:bg-red-900/40">
                Critical
              </div>
              <p className="flex-1 leading-normal">
                This will completely remove access privileges and clear database
                indices for all{" "}
                <strong className="font-bold">
                  {selectedLibrarians.length} selected records
                </strong>
                . This process cannot be undone.
              </p>
            </div>

            <AlertDialogFooter className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <AlertDialogCancel
                disabled={isBulkDeleting}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition-all duration-200 active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
              >
                Cancel
              </AlertDialogCancel>

              <button
                onClick={handleBulkDeleteRecords}
                disabled={isBulkDeleting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium text-white shadow-md shadow-rose-200/50 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-70 disabled:pointer-events-none cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 dark:shadow-none"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    <span>Wiping Records...</span>
                  </>
                ) : (
                  <>
                    <Trash2Icon className="h-4 w-4" />
                    <span>Purge Selection</span>
                  </>
                )}
              </button>
            </AlertDialogFooter>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
