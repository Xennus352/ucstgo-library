"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  BookOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpDown,
  ChevronDown,
  RefreshCw,
  Download,
  Printer,
  Users,
  Book,
  FileSpreadsheet,
  FileText,
  FileDown,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Import Shadcn AlertDialog primitives
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

// Import your server actions
import { getAllActiveBorrows } from "@/app/actions/get-borrows";
import { returnBookAction } from "@/app/actions/return";

interface BorrowRecordWithDetails {
  id: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  status: "BORROWED" | "RETURNED" | "OVERDUE";
  user: {
    id: string;
    name: string;
    email: string;
    studentId: string | null;
    faculty: string | null;
  };
  copy: {
    id: string;
    barcode: string;
    shelfLocation: string | null;
    book: {
      id: string;
      title: string;
      isbn: string;
      category: {
        id: string;
        name: string;
      };
      author: {
        id: string;
        name: string;
      };
    };
  };
}

const getCategories = (records: BorrowRecordWithDetails[]) => {
  const categories = new Set(records.map((r) => r.copy.book.category.name));
  return ["All Categories", ...Array.from(categories)];
};

const STATUS_CONFIG = {
  BORROWED: {
    label: "Borrowed",
    color:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Clock,
  },
  RETURNED: {
    label: "Returned",
    color:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle,
  },
  OVERDUE: {
    label: "Overdue",
    color:
      "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertCircle,
  },
};

export default function AdminBorrowManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState<
    "ALL" | "BORROWED" | "RETURNED" | "OVERDUE"
  >("ALL");
  const [sortBy, setSortBy] = useState<
    "borrowDate" | "dueDate" | "status" | "user" | "book"
  >("borrowDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(
    new Set(),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ADD THIS STATE FOR THE EXPORT MENU
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Initialize records state as empty array instead of mock data
  const [records, setRecords] = useState<BorrowRecordWithDetails[]>([]);

  // State to hold data for the target record being returned
  const [confirmReturnData, setConfirmReturnData] = useState<{
    id: string;
    title: string;
    studentName: string;
  } | null>(null);

  // 1. Fetch data from DB on mount
  const loadDatabaseRecords = useCallback(async () => {
    setIsRefreshing(true);
    const result = await getAllActiveBorrows();
    if (result.success && result.data) {
      // Parse ISO string dates into real JavaScript Date instances
      const formatted = result.data.map((record: any) => ({
        ...record,
        borrowDate: new Date(record.borrowDate),
        dueDate: new Date(record.dueDate),
        returnDate: record.returnDate ? new Date(record.returnDate) : null,
      }));
      setRecords(formatted);
    } else {
      toast.error(result.error || "Failed to sync library circulation rows");
    }
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    loadDatabaseRecords();
  }, [loadDatabaseRecords]);

  // 2. Operational handler triggered after custom modal confirmation
  const handleProcessReturn = async (recordId: string) => {
    setProcessingId(recordId);
    try {
      const res = await returnBookAction(recordId);
      if (!res.success) throw new Error(res.error);

      toast.success(res.message || "Book verified and restocked!");
      await loadDatabaseRecords(); // Sync UI data state automatically
    } catch (err: any) {
      toast.error(err.message || "Could not check-in copy");
    } finally {
      setProcessingId(null);
      setConfirmReturnData(null);
    }
  };

  const categories = useMemo(() => getCategories(records), [records]);

  const filteredRecords = useMemo(() => {
    let filtered = [...records];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.copy.book.title.toLowerCase().includes(query) ||
          record.user.name.toLowerCase().includes(query) ||
          record.user.email.toLowerCase().includes(query) ||
          record.user.studentId?.toLowerCase().includes(query) ||
          record.copy.book.isbn.includes(query) ||
          record.copy.book.author.name.toLowerCase().includes(query),
      );
    }

    if (selectedCategory !== "All Categories") {
      filtered = filtered.filter(
        (record) => record.copy.book.category.name === selectedCategory,
      );
    }

    if (selectedStatus !== "ALL") {
      filtered = filtered.filter((record) => record.status === selectedStatus);
    }

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "borrowDate":
          comparison = a.borrowDate.getTime() - b.borrowDate.getTime();
          break;
        case "dueDate":
          comparison = a.dueDate.getTime() - b.dueDate.getTime();
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "user":
          comparison = a.user.name.localeCompare(b.user.name);
          break;
        case "book":
          comparison = a.copy.book.title.localeCompare(b.copy.book.title);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    records,
    searchQuery,
    selectedCategory,
    selectedStatus,
    sortBy,
    sortOrder,
  ]);

  const stats = useMemo(() => {
    const total = records.length;
    const borrowed = records.filter((r) => r.status === "BORROWED").length;
    const overdue = records.filter((r) => r.status === "OVERDUE").length;
    const returned = records.filter((r) => r.status === "RETURNED").length;
    const active = borrowed + overdue;
    return { total, borrowed, overdue, returned, active };
  }, [records]);

  // Helper mapping function to format flat data structure for export utilities
  const prepareExportData = () => {
    return filteredRecords.map((record) => ({
      "Record ID": record.id,
      "Book Title": record.copy.book.title,
      Author: record.copy.book.author.name,
      ISBN: record.copy.book.isbn,
      Barcode: record.copy.barcode,
      "Shelf Location": record.copy.shelfLocation || "N/A",
      "Borrower Name": record.user.name,
      "Borrower Email": record.user.email,
      "Student ID": record.user.studentId || "N/A",
      "Borrow Date": format(record.borrowDate, "yyyy-MM-dd"),
      "Due Date": format(record.dueDate, "yyyy-MM-dd"),
      Status: record.status,
    }));
  };

  // Handler to export filtered records data rows into an Excel sheet configuration (.xlsx)
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      toast.error("No active records available to export.");
      return;
    }

    const dataToExport = prepareExportData();
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Circulation Report");

    // Auto-adjust column widths cleanly
    const maxProps = Object.keys(dataToExport[0]);
    worksheet["!cols"] = maxProps.map((key) => ({
      wch:
        Math.max(
          ...dataToExport.map(
            (row) => row[key as keyof typeof row]?.toString().length || 0,
          ),
          key.length,
        ) + 3,
    }));

    XLSX.writeFile(
      workbook,
      `library_borrows_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`,
    );
    toast.success("Excel sheet workbook downloaded successfully!");
    setShowExportMenu(false);
  };

  // Handler to export filtered records data rows into an instant browser CSV sheet download
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error("No active records available to export.");
      return;
    }

    const headers = [
      "Record ID",
      "Book Title",
      "Author",
      "ISBN",
      "Barcode",
      "Shelf Location",
      "Borrower Name",
      "Borrower Email",
      "Student ID",
      "Borrow Date",
      "Due Date",
      "Status",
    ];

    const csvRows = filteredRecords.map((record) => [
      `"${record.id}"`,
      `"${record.copy.book.title.replace(/"/g, '""')}"`,
      `"${record.copy.book.author.name.replace(/"/g, '""')}"`,
      `"${record.copy.book.isbn}"`,
      `"${record.copy.barcode}"`,
      `"${record.copy.shelfLocation || "N/A"}"`,
      `"${record.user.name.replace(/"/g, '""')}"`,
      `"${record.user.email}"`,
      `"${record.user.studentId || "N/A"}"`,
      `"${format(record.borrowDate, "yyyy-MM-dd")}"`,
      `"${format(record.dueDate, "yyyy-MM-dd")}"`,
      `"${record.status}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...csvRows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `library_borrows_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report file exported successfully!");
    setShowExportMenu(false);
  };

  // Handler to call system level print viewport pipeline
  const handleExportPDF = () => {
    if (filteredRecords.length === 0) {
      toast.error("No active records available to export.");
      return;
    }

    // 1. Initialize a new document (Landscape orientation gives columns breathing room)
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // 2. Define structural layout metadata
    const title = "Library Circulation & Borrow Management Report";
    const dateStr = `Generated on: ${format(new Date(), "PPPP 'at' p")}`;

    // 3. Setup Table Columns (Match headers with your data keys)
    const tableHeaders = [
      [
        "Title",
        "Borrower",
        "Student ID",
        "Borrow Date",
        "Due Date",
        "Barcode",
        "Status",
      ],
    ];

    // 4. Map rows and handle potential null/long string data
    const tableRows = filteredRecords.map((record) => [
      record.copy.book.title,
      record.user.name,
      record.user.studentId || "N/A",
      format(record.borrowDate, "yyyy-MM-dd"),
      format(record.dueDate, "yyyy-MM-dd"),
      record.copy.barcode,
      record.status,
    ]);

    // 5. Add Document Header Text
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(dateStr, 14, 22);

    // 6. Generate the Grid with autoTable
    autoTable(doc, {
      startY: 26,
      head: tableHeaders,
      body: tableRows,
      theme: "striped",
      headStyles: {
        fillColor: [37, 99, 235], // Blue 600 theme color to match your UI
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [51, 51, 51],
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // Subtle gray zebra rows
      },
      columnStyles: {
        0: { cellWidth: 60 }, // Give Title more space
        1: { cellWidth: 40 }, // Borrower name space
      },
      margin: { top: 25, right: 14, bottom: 15, left: 14 },
      didDrawPage: (data) => {
        // Simple page number footer configuration
        const pageCount = doc.internal.pages.length - 1;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          doc.internal.pageSize.getWidth() - 25,
          doc.internal.pageSize.getHeight() - 10,
        );
      },
    });

    // 7. Save and clear modal states
    doc.save(`library_report_${format(new Date(), "yyyyMMdd_HHmmss")}.pdf`);
    toast.success("PDF report generated successfully!");
    setShowExportMenu(false);
  };

  const handleSelectAll = useCallback(() => {
    if (selectedRecords.size === filteredRecords.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(filteredRecords.map((r) => r.id)));
    }
  }, [filteredRecords, selectedRecords]);

  const handleSelectRecord = useCallback((id: string) => {
    setSelectedRecords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const getDaysUntilDue = (dueDate: Date) => {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (status: BorrowRecordWithDetails["status"]) => {
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 print:bg-white print:p-0">
      {/* Injecting CSS Media Queries directly into layout to control clean paper formatting dynamically on Print calls */}
      <style>{`
        @media print {
          body { color: #000 !important; background: #fff !important; }
          button, select, input, .print\\:hidden, .no-print { display: none !important; }
          .shadow, .border { shadow: none !important; border-color: #e5e7eb !important; }
        }
      `}</style>

      {/* Modern Export Dropdown  */}
      <div className="relative flex items-center">
        {/* Export dropdown group */}
        <div className="relative flex items-center">
          <Button
            onClick={handleExportExcel}
            className="rounded-r-none border-r-0 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-sm hover:shadow transition-all duration-200 px-4 py-2.5 flex items-center gap-2 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span className="text-sm font-medium">Export</span>
          </Button>

          <Button
            variant="outline"
            className="rounded-l-none px-3 border-l-0 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all duration-200 cursor-pointer"
            onClick={() => setShowExportMenu(!showExportMenu)}
            aria-expanded={showExportMenu}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`}
            />
          </Button>

          {/* Dropdown Menu  */}
          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-100/80 dark:border-gray-800/60 p-2 z-50 animate-in fade-in slide-in-from-top-3 duration-200 ease-out max-h-[80vh] overflow-y-auto">
                {/* Dropdown content Header*/}

                <div className="px-3 py-2.5 mb-1.5">
                  <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    Export Options
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Select your preferred data architecture
                  </p>
                </div>

                <div className="space-y-1">
                  {/* Excel Option */}
                  <button
                    onClick={handleExportExcel}
                    className="w-full px-3 py-2.5 flex items-center gap-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all duration-150 group cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 flex items-center justify-center border border-emerald-500/20 dark:border-emerald-500/30 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          Excel Spreadsheet
                        </p>
                        <span className="text-[9px] font-medium tracking-wide px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/30 shrink-0">
                          Best Choice
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                        Preserves complete formatting & dynamic grids
                      </p>
                    </div>
                  </button>

                  {/* CSV Option */}
                  <button
                    onClick={handleExportCSV}
                    className="w-full px-3 py-2.5 flex items-center gap-3.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-all duration-150 group cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 flex items-center justify-center border border-blue-500/20 dark:border-blue-500/30 group-hover:scale-105 transition-transform">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          Comma Separated (CSV)
                        </p>
                        <span className="text-[9px] font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800/80 px-1.5 py-0.5 rounded-md shrink-0 border border-gray-200/20 dark:border-gray-700/30">
                          Raw
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                        Universal format for alternative processing systems
                      </p>
                    </div>
                  </button>
                </div>

                {/* Footer Status Wrapper */}
                <div className="px-3 py-2.5 mt-2 border-t border-gray-100/70 dark:border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                  <span>Ready configuration</span>
                  <span className="font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-mono">
                    {filteredRecords.length} Rows
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* PDF Button - Separate */}
        <Button
          variant="outline"
          onClick={handleExportPDF}
          className="ml-2 px-3 py-2.5 flex items-center gap-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-150 group cursor-pointer border border-gray-200 dark:border-gray-700"
        >
          <div className="w-7 h-7 rounded-lg bg-red-500/10 dark:bg-red-500/15 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FileDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
            PDF
          </span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 print:mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700 print:border-gray-300">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-700">
              Total Borrows
            </p>
            <Book className="h-4 w-4 text-gray-400 print:hidden" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 print:text-lg">
            {stats.total}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-blue-100 dark:border-blue-900 print:border-gray-300">
          <div className="flex items-center justify-between">
            <p className="text-xs text-blue-600 dark:text-blue-400 print:text-gray-700">
              Active Borrows
            </p>
            <Users className="h-4 w-4 text-blue-400 print:hidden" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1 print:text-lg print:text-black">
            {stats.active}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-red-100 dark:border-red-900 print:border-gray-300">
          <div className="flex items-center justify-between">
            <p className="text-xs text-red-600 dark:text-red-400 print:text-gray-700">
              Overdue
            </p>
            <AlertCircle className="h-4 w-4 text-red-400 print:hidden" />
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1 print:text-lg print:text-black">
            {stats.overdue}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-green-100 dark:border-green-900 print:border-gray-300">
          <div className="flex items-center justify-between">
            <p className="text-xs text-green-600 dark:text-green-400 print:text-gray-700">
              Returned
            </p>
            <CheckCircle className="h-4 w-4 text-green-400 print:hidden" />
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1 print:text-lg print:text-black">
            {stats.returned}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-yellow-100 dark:border-yellow-900 print:border-gray-300">
          <div className="flex items-center justify-between">
            <p className="text-xs text-yellow-600 dark:text-yellow-400 print:text-gray-700">
              Borrowed
            </p>
            <Clock className="h-4 w-4 text-yellow-400 print:hidden" />
          </div>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1 print:text-lg print:text-black">
            {stats.borrowed}
          </p>
        </div>
      </div>

      {/* Filters Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 border border-gray-100 dark:border-gray-700 print:hidden">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, author, student, or ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="relative min-w-[180px]">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm appearance-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="cursor-pointer">
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative min-w-[150px]">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full pl-4 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm appearance-none cursor-pointer"
            >
              <option value="ALL" className="cursor-pointer">
                All Status
              </option>
              <option value="BORROWED" className="cursor-pointer">
                Borrowed
              </option>
              <option value="OVERDUE" className="cursor-pointer">
                Overdue
              </option>
              <option value="RETURNED" className="cursor-pointer">
                Returned
              </option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="pl-4 pr-10 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm appearance-none cursor-pointer"
            >
              <option value="borrowDate" className="cursor-pointer">
                Borrow Date
              </option>
              <option value="dueDate" className="cursor-pointer">
                Due Date
              </option>
              <option value="status" className="cursor-pointer">
                Status
              </option>
              <option value="user" className="cursor-pointer">
                User
              </option>
              <option value="book" className="cursor-pointer">
                Book Title
              </option>
            </select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 text-gray-500 cursor-pointer h-full"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700 print:border-none print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full print:text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 print:bg-gray-100 print:border-gray-300">
              <tr>
                <th className="px-4 py-3 text-left w-10 print:hidden">
                  <input
                    type="checkbox"
                    checked={
                      selectedRecords.size === filteredRecords.length &&
                      filteredRecords.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                  Book Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                  Borrower
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                  Borrow Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                  Location / Barcode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 print:border-b">
              {filteredRecords.map((record) => {
                const daysUntilDue = getDaysUntilDue(record.dueDate);
                const isOverdue = record.status === "OVERDUE";
                const isReturned = record.status === "RETURNED";

                return (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors break-inside-avoid"
                  >
                    <td className="px-4 py-3 print:hidden">
                      <input
                        type="checkbox"
                        checked={selectedRecords.has(record.id)}
                        onChange={() => handleSelectRecord(record.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px] print:max-w-none">
                          {record.copy.book.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {record.copy.book.author.name}
                        </p>
                        <p className="text-[11px] font-mono text-gray-400">
                          ISBN: {record.copy.book.isbn}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {record.user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.user.email}
                        </p>
                        {record.user.studentId && (
                          <p className="text-[11px] font-mono text-gray-400">
                            ID: {record.user.studentId}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 print:text-black">
                      {format(record.borrowDate, "MMM d, yyyy")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-600 dark:text-gray-300 print:text-black">
                        {format(record.dueDate, "MMM d, yyyy")}
                      </div>
                      {!isReturned && (
                        <div
                          className={`text-xs font-medium print:hidden ${isOverdue ? "text-red-600" : daysUntilDue <= 3 ? "text-yellow-600" : "text-green-600"}`}
                        >
                          {isOverdue
                            ? `${Math.abs(daysUntilDue)} days overdue`
                            : `${daysUntilDue} days left`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-700 dark:text-gray-300 print:text-black">
                        Shelf: {record.copy.shelfLocation || "N/A"}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-1 rounded inline-block mt-0.5 print:bg-none print:text-black print:p-0">
                        {record.copy.barcode}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-4 py-3 text-center print:hidden">
                      {!isReturned ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            setConfirmReturnData({
                              id: record.id,
                              title: record.copy.book.title,
                              studentName: record.user.name,
                            })
                          }
                          disabled={processingId === record.id}
                          className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 rounded shadow-sm transition-colors cursor-pointer h-auto"
                        >
                          {processingId === record.id ? "Syncing..." : "Return"}
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400 italic">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No borrow records found
            </p>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 print:hidden">
        <p className="text-sm text-gray-500">Showing page 1 of 1</p>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="cursor-pointer"
          >
            Previous
          </Button>
          <Button size="sm" className="cursor-pointer">
            1
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Custom Shadcn UI Confirmation Dialog */}
      <AlertDialog
        open={confirmReturnData !== null}
        onOpenChange={(isOpen) => !isOpen && setConfirmReturnData(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Book Return</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm return of{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                "{confirmReturnData?.title}"
              </span>{" "}
              from student{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {confirmReturnData?.studentName}
              </span>
              ? This will verify the dropoff check-in and immediately restock
              the book copy items back to availability status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmReturnData) {
                  handleProcessReturn(confirmReturnData.id);
                }
              }}
              className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer"
            >
              Process Return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
