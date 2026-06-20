"use client";

import * as React from "react";
import {
  SearchIcon,
  PlusIcon,
  MailIcon,
  HashIcon,
  SchoolIcon,
  CalendarIcon,
  PhoneIcon,
  CheckCircle2Icon,
  XCircleIcon,
  BookOpenIcon,
  ClockIcon,
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

import { AlertTriangle, Trash2, X } from "lucide-react";

import { User } from "@/types/UserType";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import CreateStudentForm from "./student-create-form";
import { Button } from "@/components/ui/button";

type EditableImportRow = {
  _localKey: string;
  name: string;
  email: string;
  studentId: string;
  faculty: string;
  phone: string;
  password?: string;
};

export function StudentTableWrapper() {
  // --- DATABASE DATATABLE CONTROL STATES ---
  const [students, setStudents] = React.useState<User[]>([]);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  // Single delete confirmation
  const [deleteStudent, setDeleteStudent] = React.useState<User | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Bulk / Multiple delete states
  const [selectedStudents, setSelectedStudents] = React.useState<User[]>([]);
  const [showBulkDeleteAlert, setShowBulkDeleteAlert] = React.useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = React.useState(false);

  // Server-side query parameters
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);

  // --- MODAL & FORM SHEET TOGGLES ---
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<User | null>(null);

  // --- BULK STAGING UTILITY STATES ---
  const [previewRows, setPreviewRows] = React.useState<EditableImportRow[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);

  // Debounce backend query searches to protect your API endpoints from keystroke floods
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Core data fetcher syncing pagination params straight to your query endpoints
  const fetchStudents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: debouncedSearch,
        role: "STUDENT",
      });
      const res = await fetch(`/api/admin/students?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to pull registry rows.");
      const payload = await res.json();

      setStudents(payload.data);
      setTotalRecords(payload.meta.total);
    } catch (err: any) {
      toast.error(err.message || "Network read failure.");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, debouncedSearch]);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // --- COMPREHENSIVE CRUD TRANSACTION SUBMITS ---

  const handleCreateSuccess = () => {
    setIsCreateOpen(false);
    fetchStudents();
    toast.success("Student profile instantiated into directory.");
  };

  const handleUpdateSuccess = () => {
    setEditingStudent(null);
    fetchStudents();
    toast.success("Student record properties updated successfully.");
  };

  const handleDeleteRecord = async () => {
    if (!deleteStudent) return;

    try {
      setIsDeleting(true);

      const res = await fetch(`/api/admin/students/${deleteStudent.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete student.");
      }

      toast.success(`${deleteStudent.name} removed successfully.`);
      setDeleteStudent(null);

      // Remove from selection array if it was checked
      setSelectedStudents((prev) =>
        prev.filter((s) => s.id !== deleteStudent.id),
      );

      fetchStudents();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Multiple / Bulk Delete Record processing
  const handleBulkDeleteRecords = async () => {
    if (selectedStudents.length === 0) return;

    try {
      setIsBulkDeleting(true);

      const res = await fetch("/api/admin/students/bulk-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedStudents.map((student) => student.id),
        }),
      });

      if (!res.ok) {
        throw new Error("Bulk deletion process encountered an error.");
      }

      toast.success(
        `Successfully removed ${selectedStudents.length} student records.`,
      );
      setSelectedStudents([]);
      setShowBulkDeleteAlert(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || "Bulk deletion failed.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // --- EXCEL BULK SPREADSHEET HANDLING WORKSPACE ---

  const handleExcelParse = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet) as any[];

        setPreviewRows(
          rawData.map((row, idx) => ({
            _localKey: `draft-${Date.now()}-${idx}`,
            name: String(row.Name || row.name || ""),
            email: String(row.Email || row.email || ""),
            studentId: String(row.StudentID || row.studentId || ""),
            faculty: String(row.Faculty || row.faculty || ""),
            phone: String(row.Phone || row.phone || ""),
            password: String(row.Password || row.password || ""),
          })),
        );
      } catch (error) {
        toast.error("Unreadable file configuration blueprint loaded.");
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
      toast.error(
        "Staging is empty or contains structural format execution gaps.",
      );
      return;
    }

    try {
      const res = await fetch("/api/admin/students/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ students: validRows }),
      });
      if (!res.ok) throw new Error("Bulk ingestion transaction refused.");

      toast.success(
        `Successfully batch initialized ${validRows.length} active records.`,
      );
      setPreviewRows([]);
      setIsImportOpen(false);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || "Batch commit fault.");
    }
  };

  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  return (
    <div className="rounded-xl border border-white/40 bg-white/70 backdrop-blur-md shadow-xs p-6 space-y-4 dark:bg-slate-900/60 dark:border-slate-800/40">
      {/* Search Toolbar Actions block */}
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
            placeholder="Search by name, email, or student ID..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/40 dark:bg-slate-950/40 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 dark:border-slate-800"
          />
        </div>

        <div className="flex w-full lg:w-auto items-center gap-2 justify-end">
          {/* Dynamic Bulk Action Trigger Button */}
          {selectedStudents.length > 0 && (
            <button
              onClick={() => setShowBulkDeleteAlert(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/40 px-3.5 py-2 text-sm font-medium transition-colors cursor-pointer animate-in fade-in slide-in-from-top-1 duration-200"
            >
              <Trash2Icon className="size-4" />
              <span>Delete Selected ({selectedStudents.length})</span>
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
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* --- CRUD DRAWER SYSTEM CONFIGURATIONS --- */}
      <ResponsiveDrawer
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        title="Register Student Account"
      >
        <CreateStudentForm onStudentCreated={handleCreateSuccess} />
      </ResponsiveDrawer>

      <ResponsiveDrawer
        open={editingStudent !== null}
        onOpenChange={(val) => !val && setEditingStudent(null)}
        title="Modify Student Record"
      >
        {editingStudent && (
          <CreateStudentForm
            studentToEdit={editingStudent}
            onStudentCreated={handleUpdateSuccess}
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
                      <th className="p-2">Student ID</th>
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
                            value={row.studentId}
                            onChange={(e) =>
                              handleCellEdit(
                                row._localKey,
                                "studentId",
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

      {/* CORE SERVER DATA DISPLAY GRID LAYOUT */}
      <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-950/20">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 dark:bg-slate-900/40 text-slate-500 font-semibold text-xs tracking-wider uppercase">
              <th className="p-4 w-10">
                <input
                  type="checkbox"
                  className="cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={
                    students.length > 0 &&
                    selectedStudents.length === students.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStudents(students);
                    } else {
                      setSelectedStudents([]);
                    }
                  }}
                />
              </th>
              <th className="p-4">Student Profile</th>
              <th className="p-4">Academic Identifiers</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4 text-center">Library Logs</th>
              <th className="p-4">Account Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center">
                  <Loader2Icon className="size-6 animate-spin text-blue-500 mx-auto" />
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-400">
                  No active student logs located.
                </td>
              </tr>
            ) : (
              students.map((student) => (
                <tr
                  key={student.id}
                  className={`hover:bg-white/50 dark:hover:bg-slate-900/30 transition-colors group ${
                    selectedStudents.some((s) => s.id === student.id)
                      ? "bg-slate-50/60 dark:bg-slate-900/20"
                      : ""
                  }`}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      className="cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedStudents.some(
                        (s) => s.id === student.id,
                      )}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents((prev) => [...prev, student]);
                        } else {
                          setSelectedStudents((prev) =>
                            prev.filter((s) => s.id !== student.id),
                          );
                        }
                      }}
                    />
                  </td>
                  <td className="p-4 flex items-center gap-3">
                    <div className="size-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {student.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-25">
                        ID: {student.id.substring(0, 8)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                      <HashIcon className="size-3" />{" "}
                      {student.studentId || "N/A"}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <SchoolIcon className="size-3 text-blue-500" />{" "}
                      {student.faculty || "Unassigned"}
                    </div>
                  </td>
                  <td className="p-4 text-xs space-y-0.5 text-slate-500">
                    <span className="flex items-center gap-1">
                      <MailIcon className="size-3" /> {student.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <PhoneIcon className="size-3" /> {student.phone || "N/A"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2.5">
                      <div className="flex flex-col items-center text-slate-600">
                        <span className="text-xs font-bold font-mono">
                          {(student as any)._count?.borrowRecords ?? 0}
                        </span>
                        <BookOpenIcon className="size-3.5 text-emerald-500" />
                      </div>
                      <div className="flex flex-col items-center text-slate-600">
                        <span className="text-xs font-bold font-mono">
                          {(student as any)._count?.reservations ?? 0}
                        </span>
                        <ClockIcon className="size-3.5 text-amber-500" />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {student.banned ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 rounded-full">
                        <Ban className="size-3.5" />
                        Banned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 rounded-full">
                        <ShieldCheck className="size-3.5" />
                        Active
                      </span>
                    )}
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                      <CalendarIcon className="size-3" /> Joined:{" "}
                      {new Date(student.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setEditingStudent(student)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Edit Properties"
                      >
                        <Edit2Icon className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteStudent(student)}
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

      {/* COMPACT SERVER-SIDE PACKAGED PAGINATION COMPONENT BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 pt-2 text-xs text-slate-500 font-medium">
        <span>
          Showing records{" "}
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {students.length}
          </span>{" "}
          of <span className="font-mono">{totalRecords}</span> values
        </span>

        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
          <Button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1 || isLoading}
            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeftIcon className="size-3.5" />
          </Button>
          <span className="px-2 font-mono whitespace-nowrap">
            Page {page} of {totalPages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages || isLoading}
            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-md hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
          >
            <ChevronRightIcon className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* --- ALERT COMPONENT: SINGLE PROFILE REMOVAL --- */}
      <AlertDialog
        open={!!deleteStudent}
        onOpenChange={(open) => {
          if (!open) setDeleteStudent(null);
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
                <AlertTriangle className="h-8 w-8 animate-pulse text-rose-500" />
              </div>
              <div className="space-y-1.5 text-center">
                <AlertDialogTitle className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Permanently delete student?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-slate-500 px-4">
                  You are initiating a destructive action to remove{" "}
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-800 border border-slate-200">
                    {deleteStudent?.name}
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
                student's academic history, grades, and profile will be wiped
                instantly.
              </p>
            </div>

            <AlertDialogFooter className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-100 pt-4">
              <AlertDialogCancel className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 cursor-pointer transition-all duration-200 active:scale-95">
                Keep Student
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

      {/* --- ALERT COMPONENT: BULK SELECTION REMOVAL --- */}
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
                  Delete {selectedStudents.length} Profiles?
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 px-4">
                  You are preparing to wipe a batch of chosen directory rows
                  simultaneously. This will impact multiple user accounts.
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
                  {selectedStudents.length} selected records
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
