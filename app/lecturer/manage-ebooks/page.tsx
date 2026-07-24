"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {  Plus, BookOpen, Pencil, X, FileUp, BookMarked } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

import { ImportModal } from "@/components/books/ImportModal";
import { BookZipImport } from "@/components/books/BookZipImport";
import { BookFormFields } from "@/components/lecturer/BookFormFields";
import { AcademicResourcesManager } from "@/components/admin/AcademicResourcesManager";


// Types matching your existing setup
interface Book {
  id: string;
  title: string;
  isbn: string;
  author: string | { id: string; name: string };
  category: string | { id: string; name: string };
  publisher: string;
  description: string;
  publicationYear: string | number;
  language: string;
  donate: string | null;
  copies: number | Array<any> | { total: number; copies: number };
  semester?: string;
  shelfLocation?: string;
  cover?: string;
  coverImage?: string;
  ebook?: {
    id: string;
    filePath: string;
    format: string;
    semester?: string;
  };
  _count?: {
    copies?: number;
  };
}

interface BookFormData {
  title: string;
  isbn: string;
  author: string;
  category: string;
  publisher: string;
  description: string;
  publicationYear: string;
  language: string;
  donate: string;
}

export default function ManageEbooks() {
  const [pending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"create" | "view" | "edit">(
    "view",
  );
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Track existing ebook state details
  const [existingEbookName, setExistingEbookName] = useState<string>("");
  const [existingSemester, setExistingSemester] = useState<string>("");

  // Form states
  const [form, setForm] = useState<BookFormData>({
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

  // Fetch Lecturer books seamlessly
  const {
    data: response,
    mutate,
    isLoading,
  } = useSWR("/api/books/lecturer", fetcher, {
    onError: (err) => {
      toast.error(err.message || "Failed to fetch books");
    },
  });

  const books = response?.data || [];

  const resetForm = () => {
    setForm({
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
    setCover(null);
    setCoverPreview(null);
    setEbook(null);
    setExistingEbookName("");
    setExistingSemester("");
    setSemester("");
    setCopies(1);
    setShelfLocation("");
    setSelectedBook(null);
  };

  const handleCoverChange = (file: File | null) => {
    setCover(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setCoverPreview(null);
    }
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      toast.error("Book title is required");
      return false;
    }
    if (!form.isbn.trim()) {
      toast.error("ISBN is required");
      return false;
    }
    if (!form.author.trim()) {
      toast.error("Author is required");
      return false;
    }
    if (!form.category.trim()) {
      toast.error("Category is required");
      return false;
    }
    return true;
  };

  const handleCreate = () => {
    if (!validateForm()) return;

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
          throw new Error(data.error || "Failed to create book");
        }

        toast.success("Book created successfully");
        await mutate();
        resetForm();
        setActiveTab("view");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        );
      }
    });
  };

  const handleEditBook = (book: Book) => {
    setSelectedBook(book);

    // Safely extract author name
    let authorValue = "";
    if (typeof book.author === "object" && book.author !== null) {
      authorValue = book.author.name || book.author.id || "";
    } else if (typeof book.author === "string") {
      authorValue = book.author;
    }

    // Safely extract category name
    let categoryValue = "";
    if (typeof book.category === "object" && book.category !== null) {
      categoryValue = book.category.name || book.category.id || "";
    } else if (typeof book.category === "string") {
      categoryValue = book.category;
    }

    // Safely extract shelf location
    let shelfLocationValue = "";
    if (Array.isArray(book.copies) && book.copies.length > 0) {
      shelfLocationValue = book.copies[0]?.shelfLocation || "";
    }

    // Safely extract semester from ebook
    let semesterValue = "";
    if (book.ebook && typeof book.ebook === "object") {
      semesterValue = book.ebook.semester || "";
    }

    // Safely extract ebook filename
    let ebookFileName = "";
    if (book.ebook && typeof book.ebook === "object") {
      ebookFileName = book.ebook.filePath?.split("/").pop() || "";
    }

    setForm({
      title: book.title || "",
      isbn: book.isbn || "",
      author: authorValue,
      category: categoryValue,
      publisher: book.publisher || "",
      description: book.description || "",
      publicationYear: book.publicationYear ? String(book.publicationYear) : "",
      language: book.language || "",
      donate: book.donate || "",
    });

    // Safely determine copies count
    let copiesValue = 1;
    if (book._count?.copies) {
      copiesValue = book._count.copies;
    } else if (Array.isArray(book.copies)) {
      copiesValue = book.copies.length;
    } else if (typeof book.copies === "number") {
      copiesValue = book.copies;
    } else if (
      book.copies &&
      typeof book.copies === "object" &&
      "total" in book.copies
    ) {
      copiesValue = book.copies.total;
    }

    setCopies(copiesValue);
    setSemester(semesterValue);
    setExistingSemester(semesterValue);
    setExistingEbookName(ebookFileName);
    setShelfLocation(shelfLocationValue);
    setCoverPreview(book.coverImage || book.cover || null);
    setEbook(null);

    setActiveTab("edit");
  };

  const handleUpdate = () => {
    if (!selectedBook) {
      toast.error("No book selected for editing");
      return;
    }

    if (!validateForm()) return;

    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) fd.append(key, value);
    });
    fd.append("copies", String(copies));
    if (cover) fd.append("cover", cover);
    if (ebook) fd.append("ebook", ebook);
    if (semester) fd.append("semester", semester);
    if (shelfLocation) fd.append("shelfLocation", shelfLocation);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/books/${selectedBook.id}`, {
          method: "PATCH",
          body: fd,
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to update book");
        }

        toast.success("Book updated successfully");
        await mutate();
        resetForm();
        setActiveTab("view");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        );
      }
    });
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
      const res = await fetch(`/api/books/${bookId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete book");
      }

      toast.success("Book deleted successfully");
      await mutate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as "create" | "view" | "edit");
    if (value === "create") {
      resetForm();
    }
  };

  return (
    <div>
      {/* Main Core Form Engine View Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs ">
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="view" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> My Books
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add New
            </TabsTrigger>
            <TabsTrigger
              value="edit"
              className="flex items-center gap-2"
              disabled={!selectedBook}
            >
              <Pencil className="w-4 h-4" /> Edit Slot
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <BookMarked className="w-4 h-4" /> Resources
            </TabsTrigger>
          </TabsList>

          {/* VIEW TAB VIEW GRID */}
          <TabsContent value="view" className="mt-0 outline-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No books created yet
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => setActiveTab("create")}
                >
                  Create Your First Book
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {books.map((book: Book) => (
                  <div
                    key={book.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-xs flex justify-between items-start"
                  >
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate">
                          {book.title}
                        </h3>
                        {book.ebook && (
                          <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-medium rounded">
                            PDF
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        by{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {typeof book.author === "object" &&
                          book.author !== null
                            ? book.author.name
                            : book.author}
                        </span>
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium pt-1">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase">
                            ISBN:
                          </span>{" "}
                          {book.isbn}
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase">
                            Category:
                          </span>{" "}
                          {typeof book.category === "object" &&
                          book.category !== null
                            ? book.category.name
                            : book.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5 ml-4 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditBook(book)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteBook(book.id)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* CREATE TAB INTERFACE */}
          <TabsContent value="create" className="mt-0 outline-hidden space-y-6">
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
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                className="hover:cursor-pointer"
                onClick={() => setShowImportModal(true)}
                variant="outline"
              >
                <FileUp className="w-4 h-4 mr-2" /> Excel Import
              </Button>
              <Button variant="outline" onClick={() => setActiveTab("view")}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={pending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {pending ? "Creating..." : "Create Book"}
              </Button>
            </div>
            {showImportModal && (
              <ImportModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
              >
                <BookZipImport
                  onComplete={() => {
                    setShowImportModal(false);
                    mutate();
                  }}
                />
              </ImportModal>
            )}
          </TabsContent>

          {/* EDIT TAB INTERFACE */}
          <TabsContent value="edit" className="mt-0 outline-hidden space-y-6">
            {selectedBook && (
              <div className="p-3.5 bg-blue-50/60 dark:bg-blue-900/10 rounded-lg border text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <p>
                  Currently Editing: <strong>{selectedBook.title}</strong>
                </p>
                {existingEbookName && (
                  <p className="text-xs text-green-600">
                    ✓ Connected Ebook File: {existingEbookName}
                  </p>
                )}
                {existingSemester && (
                  <p className="text-xs text-purple-600">
                    📚 Assigned Academic Semester: {existingSemester}
                  </p>
                )}
              </div>
            )}

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
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  setActiveTab("view");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={pending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {pending ? "Updating..." : "Update Details"}
              </Button>
            </div>
          </TabsContent>

          {/* RESOURCES TAB */}
          <TabsContent value="resources" className="mt-0 outline-hidden">
            <AcademicResourcesManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
