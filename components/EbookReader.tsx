"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// 1. IMPORT REQUIRED STYLES (Crucial for page text selections & structure)
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// 2. CONFIGURE WEB WORKER (Prevents heavy file parsing from slowing down the browser)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface EbookReaderProps {
  fileUrl: string;
  onClose: () => void;
}

export default function EbookReader({ fileUrl, onClose }: EbookReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Triggered once the file is fully parsed
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
  }

  function changePage(offset: number) {
    setPageNumber((prevPageNumber) => {
      const targetPage = prevPageNumber + offset;
      if (numPages && (targetPage < 1 || targetPage > numPages))
        return prevPageNumber;
      return targetPage;
    });
  }

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-95 z-50 flex flex-col h-screen text-white">
      {/* 1. Header Toolbar */}
      <header className="flex justify-between items-center bg-slate-800 px-6 py-4 border-b border-slate-700 shadow-md">
        <div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition"
          >
            ← Close Book
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            disabled={pageNumber <= 1}
            onClick={() => changePage(-1)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded text-sm font-medium transition"
          >
            Previous
          </button>
          <span className="text-sm tracking-wide">
            Page <strong>{pageNumber}</strong> of {numPages || "..."}
          </span>
          <button
            disabled={numPages ? pageNumber >= numPages : true}
            onClick={() => changePage(1)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 rounded text-sm font-medium transition"
          >
            Next
          </button>
        </div>
        <div className="w-[100px]" /> {/* Spacer balance */}
      </header>

      {/* 2. Reader Viewport Container */}
      <main className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-900 items-start">
        <div className="relative border border-slate-700 bg-white rounded-md shadow-2xl p-2 max-w-4xl">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800 bg-opacity-50 text-white z-10 text-sm">
              Loading eBook content...
            </div>
          )}

          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading=""
          >
            <Page
              pageNumber={pageNumber}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="max-w-full"
            />
          </Document>
        </div>
      </main>
    </div>
  );
}
