"use client";

import { X, FileUp, Download } from "lucide-react";
import { SAMPLE_ZIP_BOOK_PATH } from "@/constants/sampleData";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function ImportModal({ isOpen, onClose, children }: ImportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 rounded-lg">
              <FileUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Bulk Import Books</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Import multiple books from a ZIP file
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sample Download Banner */}
        <div className="mx-6 mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Need a template? Download our sample format structure.
          </div>
          <a
            href={SAMPLE_ZIP_BOOK_PATH}
            download="sample_books.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Sample.zip
          </a>
        </div>

        {/* Dynamic Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
