"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import PdfCanvasView from "./PdfCanvasView";
import {
  ChevronLeft,
  ChevronRight,
  X,
  BookOpen,
  Maximize2,
  Minimize2,
} from "lucide-react";

const BASE_PAGE_HEIGHT = 1200;

export default function EbookReaderContainer({
  fileUrl,
  onClose,
  title = "Document",
  author = "University Library",
}: any) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>("1");
  const [loading, setLoading] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [scale, setScale] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isScrolling, setIsScrolling] = useState<boolean>(false);

  const readerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize the virtualizer to prevent recreation
  const rowVirtualizer = useVirtualizer({
    count: numPages || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => BASE_PAGE_HEIGHT * scale,
    overscan: 2,
    onChange: (instance) => {
      const [firstVisible] = instance.getVirtualItems();
      if (firstVisible && !isScrolling) {
        setPageNumber(firstVisible.index + 1);
      }
    },
  });

  // Scroll to page function
  const scrollToPage = useCallback(
    (targetPage: number) => {
      if (!numPages || targetPage < 1 || targetPage > numPages) return;

      setIsScrolling(true);

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Scroll to the target page
      rowVirtualizer.scrollToIndex(targetPage - 1, { align: "start" });
      setPageNumber(targetPage);

      // Reset scrolling flag after animation completes
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 300);
    },
    [numPages, rowVirtualizer],
  );

  const handlePageSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPage = parseInt(pageInput, 10);
    if (!isNaN(parsedPage) && parsedPage > 0 && parsedPage <= (numPages || 0)) {
      scrollToPage(parsedPage);
    } else {
      setPageInput(pageNumber.toString());
    }
  };

  useEffect(() => {
    setPageInput(pageNumber.toString());
  }, [pageNumber]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === readerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollToPage(pageNumber - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollToPage(pageNumber + 1);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pageNumber, scrollToPage]);

  return (
    <div
      ref={readerRef}
      className="fixed inset-0 bg-slate-950 z-50 flex flex-col h-screen w-screen overflow-hidden"
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

          {/* Symmetrical Desktop Layout Pagination with Wide Search Bar */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => scrollToPage(pageNumber - 1)}
              disabled={pageNumber <= 1}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20 transition-all shrink-0"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <form
              onSubmit={handlePageSearchSubmit}
              className="flex items-center gap-2.5 px-3 py-1 bg-slate-800/40 rounded-lg border border-slate-700/40 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
            >
              <svg
                className="w-3.5 h-3.5 text-slate-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>

              <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={() => setPageInput(pageNumber.toString())}
                  placeholder="Search..."
                  className="w-24 bg-slate-950 text-white pl-2 pr-1 font-semibold rounded-md border border-slate-800 py-0.5 focus:outline-hidden font-mono text-xs shadow-xs placeholder:text-slate-600 placeholder:font-sans"
                  title="Type page number and press Enter"
                />
                <span className="text-slate-600 font-normal px-0.5 select-none">
                  /
                </span>
                <span className="text-slate-300 font-semibold select-none pr-1 min-w-[16px] text-left">
                  {numPages || "..."}
                </span>
              </div>
            </form>

            <button
              onClick={() => scrollToPage(pageNumber + 1)}
              disabled={!numPages || pageNumber >= numPages}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-20 transition-all shrink-0"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Controls Trigger Layout */}
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

      <div className="flex-1 overflow-hidden relative flex items-center justify-center">
        <PdfCanvasView
          fileUrl={fileUrl}
          onDocumentLoadSuccess={({ numPages }) => {
            setNumPages(numPages);
            setLoading(false);
          }}
          scale={scale}
          rowVirtualizer={rowVirtualizer}
          parentRef={parentRef}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 z-30">
            Loading...
          </div>
        )}

        {/* Mobile floating pill layout with Integrated Touch-Safe Page Search */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/95 backdrop-blur-xl rounded-full shadow-2xl px-3.5 py-2 border border-slate-800/90 sm:hidden z-20">
          <button
            onClick={() => scrollToPage(pageNumber - 1)}
            disabled={pageNumber <= 1}
            className="p-2 rounded-full text-slate-400 active:bg-slate-800 active:text-white disabled:opacity-20 transition-all touch-manipulation"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Mobile Search Form Wrapper */}
          <form
            onSubmit={handlePageSearchSubmit}
            className="flex items-center gap-1 px-3 py-1 bg-slate-950 rounded-full border border-slate-800 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all"
          >
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={() => setPageInput(pageNumber.toString())}
              className="w-10 bg-transparent text-white text-center font-bold focus:outline-hidden font-mono text-sm"
            />
            <span className="text-slate-600 select-none text-xs">/</span>
            <span className="text-white font-semibold select-none text-xs pl-0.5 min-w-[14px] text-center font-mono">
              {numPages || "..."}
            </span>
          </form>

          <button
            onClick={() => scrollToPage(pageNumber + 1)}
            disabled={!numPages || pageNumber >= numPages}
            className="p-2 rounded-full text-slate-400 active:bg-slate-800 active:text-white disabled:opacity-20 transition-all touch-manipulation"
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
