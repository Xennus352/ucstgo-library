// app/admin/reservations/components/Pagination.tsx
"use client";

import { getPageNumbers } from "@/lib/pagination";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  indexOfFirstItem: number;
  indexOfLastItem: number;
  totalItems: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  indexOfFirstItem,
  indexOfLastItem,
  totalItems,
  setCurrentPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const numbers = getPageNumbers(currentPage, totalPages);

  return (
    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
      <p className="text-sm text-gray-600">
        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} results
      </p>
      <div className="flex space-x-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {numbers.map((page, i) =>
          page === "…" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-1 py-1 text-sm text-gray-400"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border rounded-lg text-sm ${
                currentPage === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ),
        )}
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}