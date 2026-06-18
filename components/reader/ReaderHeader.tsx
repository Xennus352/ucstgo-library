"use client";

interface ReaderHeaderProps {
  pageNumber: number;
  numPages: number | null;
  onClose: () => void;
  onChangePage: (offset: number) => void;
}

export default function ReaderHeader({
  pageNumber,
  numPages,
  onClose,
  onChangePage,
}: ReaderHeaderProps) {
  return (
    <header className="flex justify-between items-center bg-slate-800 px-6 py-4 border-b border-slate-700 shadow-md">
      <div>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition"
        >
          ← Close Book
        </button>
      </div>
      <div className="flex items-center gap-4 text-white">
        <button
          disabled={pageNumber <= 1}
          onClick={() => onChangePage(-1)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded text-sm font-medium transition"
        >
          Previous
        </button>
        <span className="text-sm tracking-wide">
          Page <strong>{pageNumber}</strong> of {numPages || "..."}
        </span>
        <button
          disabled={numPages ? pageNumber >= numPages : true}
          onClick={() => onChangePage(1)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded text-sm font-medium transition"
        >
          Next
        </button>
      </div>
      <div className="w-25" />
    </header>
  );
}