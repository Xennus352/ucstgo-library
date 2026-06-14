"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { toast } from "sonner";
import { ArrowLeft, Eye, Edit, CheckCircle } from "lucide-react";

import { BookPreviewCard } from "../BookPreview";
import { BookFormFields } from "./BookFormField";

export default function CreateBookForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

  const [form, setForm] = useState({
    title: "",
    isbn: "",
    author: "",
    category: "",
    publisher: "",
    description: "",
    publicationYear: "",
    language: "",
  });

  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [ebook, setEbook] = useState<File | null>(null);
  const [copies, setCopies] = useState(1);
  const [shelfLocation, setShelfLocation] = useState("");

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

    if (!cover) {
      toast.error("Cover image is required");
      return;
    }

    const fd = new FormData();

    Object.entries(form).forEach(([key, value]) => {
      if (value) fd.append(key, value);
    });
    fd.append("copies", String(copies));
    fd.append("cover", cover);
    if (ebook) fd.append("ebook", ebook);
    if (shelfLocation) fd.append("shelfLocation", shelfLocation);

    startTransition(async () => {
      try {
        const res = await fetch("/api/books", {
          method: "POST",
          body: fd,
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to create book");
          return;
        }

        toast.success("Book created successfully");
        router.push("/admin/books");
      } catch (err) {
        toast.error("Something went wrong");
      }
    });
  };

  return (
    <div className="w-full mx-auto">
      {/* Header */}
      <div className="mb-5">
        <button
          onClick={() => router.push("/admin/books")}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Books
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Add New Book
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create a new book record
          </p>
        </div>
      </div>

      {/* Mobile Tab View */}
      <div className="lg:hidden">
        <div className="flex gap-2 mb-4 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab("form")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all relative ${
              activeTab === "form"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Edit className="w-3.5 h-3.5" />
            Form
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all relative ${
              activeTab === "preview"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>

        <div className="mt-4">
          {activeTab === "form" ? (
            <BookFormFields
              form={form}
              setForm={setForm}
              coverPreview={coverPreview}
              handleCoverChange={handleCoverChange}
              ebook={ebook}
              setEbook={setEbook}
              copies={copies}
              setCopies={setCopies}
              shelfLocation={shelfLocation}
              setShelfLocation={setShelfLocation}
            />
          ) : (
            <BookPreviewCard
              title={form.title}
              description={form.description}
              author={form.author}
              category={form.category}
              isbn={form.isbn}
              publicationYear={form.publicationYear}
              copies={copies}
              coverUrl={coverPreview}
              hasEbook={!!ebook}
              shelfLocation={shelfLocation}
              onRemoveCover={() => handleCoverChange(null)}
            />
          )}
        </div>
      </div>

      {/* Desktop Split View */}
      <div className="hidden lg:grid lg:grid-cols-2 gap-6">
        <div>
          <BookFormFields
            form={form}
            setForm={setForm}
            coverPreview={coverPreview}
            handleCoverChange={handleCoverChange}
            ebook={ebook}
            setEbook={setEbook}
            copies={copies}
            setCopies={setCopies}
            shelfLocation={shelfLocation}
            setShelfLocation={setShelfLocation}
          />
        </div>
        <div>
          <BookPreviewCard
            title={form.title}
            description={form.description}
            author={form.author}
            category={form.category}
            isbn={form.isbn}
            publicationYear={form.publicationYear}
            copies={copies}
            coverUrl={coverPreview}
            hasEbook={!!ebook}
            shelfLocation={shelfLocation}
            onRemoveCover={() => handleCoverChange(null)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/books")}
          className="px-5 h-9 text-sm"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={pending}
          className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md transition-all duration-200 px-5 h-9 text-sm"
        >
          {pending ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle className="w-3.5 h-3.5 mr-2" />
              Create Book
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
