"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfCanvasViewProps {
  fileUrl: string;
  numPages: number | null;
  setPageNumber: React.Dispatch<React.SetStateAction<number>>;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
}

export default function PdfCanvasView({
  fileUrl,
  numPages,
  setPageNumber,
  onDocumentLoadSuccess,
  scale,
  setScale,
}: PdfCanvasViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // Auto-calculate base scale fit
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth;
      setContainerWidth(width);

      const basePdfWidth = 800;
      const padding = window.innerWidth < 640 ? 24 : 48;
      const availableWidth = width - padding;

      if (availableWidth < basePdfWidth) {
        const optimalScale = Number((availableWidth / basePdfWidth).toFixed(2));
        setScale(optimalScale);
      } else {
        setScale(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setScale]);

  // IntersectionObserver detects which page is active on continuous scroll
  useEffect(() => {
    if (!numPages) return;

    const observerOptions = {
      root: containerRef.current,
      rootMargin: "0px",
      threshold: 0.3, // Triggers when 30% of a page wrapper element is visible
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageAttr = entry.target.getAttribute("data-page-number");
          if (pageAttr) {
            setPageNumber(parseInt(pageAttr, 10));
          }
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    // Dynamic timeout to wait for actual pages to mount to the DOM tree
    const timeoutId = setTimeout(() => {
      for (let i = 1; i <= numPages; i++) {
        const el = document.getElementById(`pdf-page-wrapper-${i}`);
        if (el) observer.observe(el);
      }
    }, 600);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [numPages, setPageNumber, scale]);

  const targetWidth = Math.min(
    containerWidth - (window.innerWidth < 640 ? 24 : 48),
    800,
  );

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto overflow-x-auto flex flex-col items-center p-4 sm:p-8 scrollbar-thin space-y-8"
    >
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        className="flex flex-col items-center space-y-8 w-full"
        loading={
          <div className="flex flex-col items-center justify-center h-72 gap-3">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-muted-foreground animate-pulse">
              Rendering Pages...
            </p>
          </div>
        }
        error={
          <div className="flex items-center justify-center h-64 text-center p-4">
            <p className="text-destructive font-medium text-sm">
              Could not load document preview.
            </p>
          </div>
        }
      >
        {numPages &&
          Array.from(new Array(numPages), (_, index) => {
            const pageNo = index + 1;
            return (
              <div
                key={`page_container_${pageNo}`}
                id={`pdf-page-wrapper-${pageNo}`}
                data-page-number={pageNo}
                className="w-full flex flex-col items-center transition-transform duration-200 ease-out"
              >
                {/* Optional mini visual indicator subtle label like modern apps */}
                <span className="text-[13px] text-slate-200 font-mono font-semibold tracking-wider mb-2 select-none">
                  Page {pageNo}
                </span>

                <Page
                  pageNumber={pageNo}
                  width={targetWidth}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-2xl rounded-md border border-border/40 bg-white"
                />
              </div>
            );
          })}
      </Document>
    </div>
  );
}
