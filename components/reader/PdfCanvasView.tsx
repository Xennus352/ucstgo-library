"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfCanvasViewProps {
  fileUrl: string;
  pageNumber: number;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
}

export default function PdfCanvasView({
  fileUrl,
  pageNumber,
  onDocumentLoadSuccess,
  scale,
  setScale,
}: PdfCanvasViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // Auto-calculate scale to fit the screen size perfectly on mount/resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth;
      setContainerWidth(width);

      // Base unscaled PDF page width assumption is 800px
      const basePdfWidth = 800;
      const padding = window.innerWidth < 640 ? 24 : 48;
      const availableWidth = width - padding;

      // Only auto-scale down if the screen is smaller than the document base width
      if (availableWidth < basePdfWidth) {
        const optimalScale = Number((availableWidth / basePdfWidth).toFixed(2));
        setScale(optimalScale);
      } else {
        setScale(1); // Default layout view on large desktop screens
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setScale]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto overflow-x-auto flex items-start justify-center p-3 sm:p-6 scrollbar-thin"
    >
      <div className="flex flex-col items-center w-full my-auto py-4">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex justify-center"
          loading={
            <div className="flex flex-col items-center justify-center h-72 gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium text-muted-foreground animate-pulse">
                Rendering Page...
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
          <Page
            key={`page_${pageNumber}`}
            pageNumber={pageNumber}
            // Dynamic resolution matching base width scaled down/up perfectly
            width={Math.min(
              containerWidth - (window.innerWidth < 640 ? 24 : 48),
              800,
            )}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-2xl rounded-md border border-border/40 bg-white transition-transform duration-200 ease-out"
          />
        </Document>
      </div>
    </div>
  );
}
