"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, CheckCircle } from "lucide-react";
import { BookFormFields } from "../books/BookFormField";

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BookManagementModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateBookModalProps) {
  const [pending, startTransition] = useTransition();

  const [form, setForm] = useState({
    title: "",
    isbn: "",
    author: "",
    category: "",
    publisher: "",
    description: "",
    publicationYear: "",
    language: "",
    donate: "",
  });

  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [ebook, setEbook] = useState<File | null>(null);
  const [semester, setSemester] = useState("");
  const [copies, setCopies] = useState(1);
  const [shelfLocation, setShelfLocation] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCoverChange = (file: File | null) => {
    setCover(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setCoverPreview(null);
    }
  };

  const handleSubmit = () => {
    if (!form.title || !form.isbn || !form.author || !form.category) {
      toast.error("Please fill all required fields");
      return;
    }

    const fd = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (value) fd.append(key, value);
    });

    fd.append("copies", String(copies));

    if (cover) fd.append("cover", cover);
    if (ebook) fd.append("ebook", ebook);
    if (semester && ebook) fd.append("semester", semester);
    if (shelfLocation) fd.append("shelfLocation", shelfLocation);

    startTransition(async () => {
      try {
        const res = await fetch("/api/books/lecturer", {
          method: "POST",
          body: fd,
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to create book");
          return;
        }

        toast.success("Book created successfully");
        if (onSuccess) onSuccess();
        onClose();
      } catch (err) {
        toast.error("Something went wrong");
      }
    });
  };

  return (
    // Changed items-end to items-start for top alignment. Added top padding for mobile breathing room.
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* Modal Wrapper */}
      {/* Changed rounded-t-xl to rounded-xl on mobile too so it looks floating from the top */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[85vh] sm:h-auto sm:max-h-[85vh] transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Add New Book
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden xs:block">
              Create a new book record without leaving the page
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          <BookFormFields
            form={form}
            setForm={setForm}
            coverPreview={coverPreview}
            handleCoverChange={handleCoverChange}
            ebook={ebook}
            setEbook={setEbook}
            semester={semester}
            setSemester={setSemester}
            copies={copies}
            setCopies={setCopies}
            shelfLocation={shelfLocation}
            setShelfLocation={setShelfLocation}
          />
        </div>

        {/* Action Buttons Footer */}
        <div className="flex justify-end gap-2 sm:gap-3 px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-4 sm:px-5 h-9 text-sm flex-1 sm:flex-initial"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={pending}
            className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm transition-all duration-200 px-4 sm:px-5 h-9 text-sm flex-1 sm:flex-initial"
          >
            {pending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 mr-2" />
                Create
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
