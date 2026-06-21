"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { Virtualizer } from "@tanstack/react-virtual";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfCanvasViewProps {
  fileUrl: string;
  onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void;
  scale: number;
  rowVirtualizer: Virtualizer<HTMLDivElement, Element>;
  parentRef: React.RefObject<HTMLDivElement | null>;
}

export default function PdfCanvasView({
  fileUrl,
  onDocumentLoadSuccess,
  scale,
  rowVirtualizer,
  parentRef,
}: PdfCanvasViewProps) {
  return (
    <div ref={parentRef} className="w-full h-full overflow-y-auto">
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={(err) => console.error("PDF Load Error:", err)}
        className="flex flex-col items-center"
        loading={<div className="p-10 text-slate-500">Loading document...</div>}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Page
                pageNumber={virtualRow.index + 1}
                width={800 * scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-xl border border-slate-700 rounded-md bg-white mb-8"
              />
            </div>
          ))}
        </div>
      </Document>
    </div>
  );
}
