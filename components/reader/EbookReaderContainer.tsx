"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { pdfjs } from "react-pdf";
import PdfCanvasView from "./PdfCanvasView";
import {
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Maximize2,
  Minimize2,
} from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface EbookReaderProps {
  fileUrl: string;
  onClose: () => void;
  title?: string;
  author?: string;
}

export default function EbookReaderContainer({
  fileUrl,
  onClose,
  title = "Document",
  author = "University Library",
}: EbookReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(true);

  // Reference to the entire reader component container
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isFullscreen) toggleFullscreen();
        else onClose();
      }
      if (e.key === "ArrowLeft" && pageNumber > 1) handleChangePage(-1);
      if (e.key === "ArrowRight" && numPages && pageNumber < numPages)
        handleChangePage(1);
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isFullscreen, pageNumber, numPages]);

  const handleDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      setPageNumber(1);
      setLoading(false);
    },
    [],
  );

  const handleChangePage = useCallback(
    (offset: number) => {
      setPageNumber((prev) => {
        const targetPage = prev + offset;
        if (numPages && (targetPage < 1 || targetPage > numPages)) return prev;
        return targetPage;
      });
    },
    [numPages],
  );

  // Targets the actual reader container component for the Fullscreen frame
  const toggleFullscreen = async () => {
    if (!readerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await readerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.error("Error attempting to toggle fullscreen context:", err);
    }
  };

  // Keep state sync'd if user exits fullscreen using native browser mechanics (like hitting ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === readerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div
      ref={readerRef}
      className="fixed inset-0 bg-slate-950 z-50 flex flex-col h-screen w-screen overflow-hidden select-none antialiased text-slate-200"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Dynamic Header Controls */}
      <header
        className={`bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 z-20 transition-all duration-300 transform ${
          showControls
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 max-w-[30%]">
            <div className="p-2 bg-primary/10 rounded-lg text-primary hidden sm:block">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate text-white">
                {title}
              </h1>
              <p className="text-[11px] text-slate-400 truncate hidden xs:block">
                {author}
              </p>
            </div>
          </div>

          {/* Symmetrical Desktop Layout Pagination */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/60 p-1 rounded-lg border border-slate-700/50">
            <button
              onClick={() => handleChangePage(-1)}
              disabled={pageNumber <= 1}
              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2 text-xs font-medium text-slate-300">
              <span>Page</span>
              <span className="text-white font-semibold">{pageNumber}</span>
              <span className="text-slate-500">/</span>
              <span>{numPages || "..."}</span>
            </div>
            <button
              onClick={() => handleChangePage(1)}
              disabled={!numPages || pageNumber >= numPages}
              className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Control Triggers */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center bg-slate-800/40 rounded-lg border border-slate-700/30 p-0.5 text-xs">
              <button
                onClick={() => setScale((p) => Math.max(p - 0.1, 0.5))}
                className="px-2 py-1 rounded-md hover:bg-slate-700 text-slate-300 transition-colors"
              >
                A-
              </button>
              <span className="w-12 text-center text-[11px] text-slate-400 font-mono">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((p) => Math.min(p + 0.1, 1.8))}
                className="px-2 py-1 rounded-md hover:bg-slate-700 text-slate-300 transition-colors"
              >
                A+
              </button>
            </div>

            <div className="w-px h-5 bg-slate-800 mx-1 hidden xs:block" />

            {/* FULLSCREEN TRIGGER BUTTON */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-all border border-slate-700/50"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all ml-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Viewport Container Frame */}
      <div className="flex-1 overflow-hidden bg-slate-950 relative flex items-center justify-center">
        <PdfCanvasView
          fileUrl={fileUrl}
          pageNumber={pageNumber}
          onDocumentLoadSuccess={handleDocumentLoadSuccess}
          scale={scale}
          setScale={setScale}
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-xs z-30">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-400">
                Opening Ebook...
              </p>
            </div>
          </div>
        )}

        {/* Mobile floating pill layout */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-slate-900/90 backdrop-blur-lg rounded-full shadow-2xl px-5 py-2.5 border border-slate-800 sm:hidden z-20">
          <button
            onClick={() => handleChangePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1 rounded-full text-slate-400 hover:text-white disabled:opacity-20 transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-xs font-semibold tracking-wider text-slate-200 font-mono min-w-15 text-center">
            {pageNumber} / {numPages || "..."}
          </span>
          <button
            onClick={() => handleChangePage(1)}
            disabled={!numPages || pageNumber >= numPages}
            className="p-1 rounded-full text-slate-400 hover:text-white disabled:opacity-20 transition-all"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Progress tracker timeline */}
      {numPages && (
        <div className="h-1 bg-slate-900 w-full shrink-0 border-t border-slate-800/30 z-20">
          <div
            className="h-full bg-linear-to-r from-primary to-indigo-500 transition-all duration-300 ease-out"
            style={{ width: `${(pageNumber / numPages) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
