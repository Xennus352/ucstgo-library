"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileArchive, CheckCircle, X, Loader2 } from "lucide-react";

interface BookZipImportProps {
  onComplete?: () => void;
}

export function BookZipImport({ onComplete }: BookZipImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.type === "application/zip" ||
        droppedFile.name.endsWith(".zip")
      ) {
        setFile(droppedFile);
      } else {
        toast.error("Please upload a ZIP file");
      }
    }
  };

  const upload = async () => {
    if (!file) {
      toast.error("Please select a ZIP file");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);

    setLoading(true);

    try {
      const res = await fetch("/api/books/import", {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Import failed");

      toast.success(`Successfully imported ${data.inserted} books!`);
      setFile(null);
      onComplete?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to import books");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
            : "border-slate-300 dark:border-slate-700 hover:border-blue-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="zip-upload"
          accept=".zip"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-2">
          {file ? (
            <>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setFile(null);
                }}
                className="absolute top-2 right-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <FileArchive className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Drag & drop or <span className="text-blue-600">browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ZIP file containing book data (JSON/CSV) and covers
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={upload}
          disabled={!file || loading}
          className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Import Books
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => setFile(null)}
          disabled={!file || loading}
        >
          Clear
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        <p>
          Expected format: ZIP containing books.json/metadata.csv and cover
          images
        </p>
      </div>
    </div>
  );
}
