"use client";

import * as React from "react";
import {
  SearchIcon,
  PlusIcon,
  MailIcon,
  SchoolIcon,
  CalendarIcon,
  PhoneIcon,
  FileSpreadsheetIcon,
  UploadCloudIcon,
  Trash2Icon,
  CheckIcon,
  Edit2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  Ban,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
} from "lucide-react";
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
import CreateTeacherForm from "./teacher-create-teacher-form";

type EditableImportRow = {
  _localKey: string;
  name: string;
  email: string;
  faculty: string;
  phone: string;
  password?: string;
};

type TeachersResponse = {
  data?: User[];
  meta?: {
    total?: number;
  };
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const stringValue = (value: unknown) =>
  typeof value === "string" ? value : value == null ? "" : String(value);

export function TeacherTableWrapper() {
  const [teachers, setTeachers] = React.useState<User[]>([]);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const [deleteTeacher, setDeleteTeacher] = React.useState<User | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const [selectedTeachers, setSelectedTeachers] = React.useState<User[]>([]);
  const [showBulkDeleteAlert, setShowBulkDeleteAlert] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [editingTeacher, setEditingTeacher] = React.useState<User | null>(null);

  const [previewRows, setPreviewRows] = React.useState<EditableImportRow[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchTeachers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: debouncedSearch,
        role: "LECTURER",
      });
      const res = await fetch(`/api/admin/teachers?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to pull teacher records.");
      const payload = (await res.json()) as TeachersResponse;

      setTeachers(payload.data ?? []);
      setTotalRecords(payload.meta?.total ?? 0);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Network read failure."));
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch]);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchTeachers();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchTeachers]);

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchTeachers();
    toast.success("Teacher profile created successfully.");
  };

  const handleUpdateSuccess = () => {
    setEditingTeacher(null);
    fetchTeachers();
    toast.success("Teacher record updated successfully.");
  };

  const handleDeleteRecord = async () => {
    if (!deleteTeacher) return;

    try {
      setIsDeleting(true);

      const res = await fetch(`/api/admin/teachers/${deleteTeacher.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete teacher.");
      }

      toast.success(`${deleteTeacher.name} removed successfully.`);
      setDeleteTeacher(null);
      setSelectedTeachers((prev) =>
        prev.filter((teacher) => teacher.id !== deleteTeacher.id),
      );

      fetchTeachers();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete teacher."));
    } finally {
      setIsDeleting(false);
    }
  };

  // const handleToggleBan = async (teacher: User) => {
  //   try {
  //     const res = await fetch(`/api/admin/teachers/${teacher.id}/ban`, {
  //       method: "PATCH",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         banned: !teacher.banned,
  //       }),
  //     });

  //     if (!res.ok) {
  //       throw new Error("Failed to update access status");
  //     }

  //     toast.success(
  //       teacher.banned
  //         ? "Teacher access restored successfully"
  //         : "Teacher account banned successfully",
  //     );

  //     fetchTeachers();
  //   } catch (error) {
  //     toast.error(getErrorMessage(error, "Failed to update access status"));
  //   }
  // };

  const handleBulkDeleteRecords = async () => {
    if (selectedTeachers.length === 0) return;

    try {
      setIsBulkDeleting(true);

      const res = await fetch("/api/admin/teachers/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedTeachers.map((teacher) => teacher.id),
        }),
      });

      if (!res.ok) {
        throw new Error("Bulk deletion process encountered an error.");
      }

      toast.success(
        `Successfully removed ${selectedTeachers.length} teacher records.`,
      );
      setSelectedTeachers([]);
      setShowBulkDeleteAlert(false);
      fetchTeachers();
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
            faculty: stringValue(row.Faculty ?? row.faculty),
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
      toast.error("Staging is empty or contains invalid teacher rows.");
      return;
    }

    try {
      const res = await fetch("/api/admin/teachers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teachers: validRows }),
      });
      if (!res.ok) throw new Error("Bulk ingestion transaction refused.");

      toast.success(
        `Successfully batch initialized ${validRows.length} active records.`,
      );
      setPreviewRows([]);
      setIsImportOpen(false);
      fetchTeachers();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Batch commit fault."));
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
            placeholder="Search teacher records..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 dark:border-slate-800"
          />
        </div>

        <div className="flex w-full lg:w-auto items-center gap-2 justify-end">
          {selectedTeachers.length > 0 && (
            <button
              onClick={() => setShowBulkDeleteAlert(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/40 px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <Trash2Icon className="size-4" />
              <span>Delete Selected ({selectedTeachers.length})</span>
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
            <span>Add Teacher</span>
          </button>
        </div>
      </div>

      <ResponsiveDrawer
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Register Teacher Account"
      >
        <CreateTeacherForm onTeacherCreated={handleCreateSuccess} />
      </ResponsiveDrawer>

      <ResponsiveDrawer
        open={editingTeacher !== null}
        onOpenChange={(val) => !val && setEditingTeacher(null)}
        title="Modify Teacher Record"
      >
        {editingTeacher && (
          <CreateTeacherForm
            teacherToEdit={editingTeacher}
            onTeacherCreated={handleUpdateSuccess}
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
                      <th className="p-2">Faculty</th>
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
                            value={row.faculty}
                            onChange={(e) =>
                              handleCellEdit(
                                row._localKey,
                                "faculty",
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2"
                >
                  <CheckIcon className="size-4" /> Save Uploaded Sheet
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
                    teachers.length > 0 &&
                    selectedTeachers.length === teachers.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTeachers(teachers);
                    } else {
                      setSelectedTeachers([]);
                    }
                  }}
                />
              </th>
              <th className="p-4">Teacher Profile</th>
              <th className="p-4">Academic Assignment</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">Access Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="p-12 text-center">
                  <Loader2Icon className="size-6 animate-spin text-blue-500 mx-auto" />
                </td>
              </tr>
            ) : teachers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-12 text-center text-slate-400">
                  No active teacher records located.
                </td>
              </tr>
            ) : (
              teachers.map((teacher) => (
                <tr
                  key={teacher.id}
                  className={`hover:bg-white/50 dark:hover:bg-slate-900/30 transition-colors group ${
                    selectedTeachers.some((s) => s.id === teacher.id)
                      ? "bg-slate-50/60 dark:bg-slate-900/20"
                      : ""
                  }`}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      className="cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedTeachers.some(
                        (s) => s.id === teacher.id,
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTeachers((prev) => [...prev, teacher]);
                        } else {
                          setSelectedTeachers((prev) =>
                            prev.filter((s) => s.id !== teacher.id),
                          );
                        }
                      }}
                    />
                  </td>
                  <td className="p-4 flex items-center gap-3">
                    <div className="size-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {teacher.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {teacher.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-25">
                        ID: {teacher.id.substring(0, 8)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                      <SchoolIcon className="size-3" />{" "}
                      {teacher.faculty || "Unassigned"}
                    </div>
                  </td>
                  <td className="p-4 text-xs space-y-0.5 text-slate-500">
                    <span className="flex items-center gap-1">
                      <MailIcon className="size-3" /> {teacher.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <PhoneIcon className="size-3" /> {teacher.phone || "N/A"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-400">
                      <CalendarIcon className="size-3" /> Joined:{" "}
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-4">
                    {teacher.banned ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-1 rounded-full">
                        <UserX className="size-3.5" /> Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 rounded-full">
                        <UserCheck className="size-3.5" /> Active
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      {/* <button
                        onClick={() => handleToggleBan(teacher)}
                        className={`p-1.5 rounded-lg transition-all duration-200 ${
                          teacher.banned
                            ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        }`}
                        title={
                          teacher.banned ? "Restore Access" : "Ban Teacher"
                        }
                      >
                        {teacher.banned ? (
                          <ShieldCheck className="size-4" />
                        ) : (
                          <Ban className="size-4" />
                        )}
                      </button> */}
                      <button
                        onClick={() => setEditingTeacher(teacher)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Edit Properties"
                      >
                        <Edit2Icon className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTeacher(teacher)}
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
            {teachers.length}
          </span>{" "}
          of <span className="font-mono">{totalRecords}</span> values
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1 || isLoading}
            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeftIcon className="size-3.5" />
          </button>
          <span className="px-2 font-mono">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || isLoading}
            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRightIcon className="size-3.5" />
          </button>
        </div>
      </div>

      <AlertDialog
        open={!!deleteTeacher}
        onOpenChange={(open) => {
          if (!open) setDeleteTeacher(null);
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
                  Permanently delete teacher?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-slate-500 px-4">
                  You are initiating a destructive action to remove{" "}
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-800 border border-slate-200">
                    {deleteTeacher?.name}
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
                <strong className="font-bold">irreversible</strong>. The
                teacher's access privileges and profile will be wiped instantly.
              </p>
            </div>

            <AlertDialogFooter className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100 pt-4">
              <AlertDialogCancel className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition-all duration-200 active:scale-95">
                Keep Teacher
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
                  Delete {selectedTeachers.length} Profiles?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 px-4">
                  You are preparing to wipe a batch of chosen directory rows
                  simultaneously. This will impact multiple teacher accounts.
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
                  {selectedTeachers.length} selected records
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
