"use client";

import { useState, useTransition, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, CheckCircle, Plus, BookOpen, Pencil } from "lucide-react";
import { BookFormFields } from "../books/BookFormField";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

// Types
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
  status?: string;
  availability?: { available: number; borrowed: number; total: number };
  _count?: { copies: number; reservations: number };
}

interface BookManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function BookManagementModal({
  isOpen,
  onClose,
  onSuccess,
}: BookManagementModalProps) {
  const [pending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"create" | "view" | "edit">(
    "create",
  );
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Track existing ebook filename
  const [existingEbookName, setExistingEbookName] = useState<string>("");
  const [existingSemester, setExistingSemester] = useState<string>("");

  // Form state for create and edit
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

  // Fetch lecturer's books using SWR
  const {
    data: response,
    error,
    mutate,
    isLoading,
  } = useSWR(isOpen ? "/api/books/lecturer" : null, fetcher, {
    onError: (err) => {
      toast.error(err.message || "Failed to fetch books");
    },
  });

  // Get books from data
  const books = response?.data || [];

  // Reset form when modal closes
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setActiveTab("create");
    } else {
      document.body.style.overflow = "unset";
      resetForm();
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Reset form fields
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

  // Handle cover change
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

  // Handle create book
  const handleCreate = () => {
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
        await mutate();
        resetForm();
        if (onSuccess) onSuccess();
      } catch (err) {
        toast.error("Something went wrong");
      }
    });
  };

  // Handle edit book - populate form with selected book data
  const handleEditBook = (book: any) => {
    setSelectedBook(book);

    // Extract author name from object or use as is
    let authorValue = "";
    if (book.author) {
      if (typeof book.author === "object") {
        authorValue = book.author.name || book.author.id || "";
      } else {
        authorValue = book.author;
      }
    }

    // Extract category name from object or use as is
    let categoryValue = "";
    if (book.category) {
      if (typeof book.category === "object") {
        categoryValue = book.category.name || book.category.id || "";
      } else {
        categoryValue = book.category;
      }
    }

    // Get shelf location from copies array if available
    let shelfLocationValue = "";
    if (book.copies && Array.isArray(book.copies) && book.copies.length > 0) {
      shelfLocationValue = book.copies[0].shelfLocation || "";
    }

    // Get semester and ebook filename from ebook object if available
    let semesterValue = "";
    let ebookFileName = "";
    if (book.ebook) {
      if (typeof book.ebook === "object") {
        semesterValue = book.ebook.semester || "";
        ebookFileName = book.ebook.filePath?.split("/").pop() || "";
      }
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

    // Handle copies - get the count from _count or copies array
    let copiesValue = 1;
    if (book._count?.copies) {
      copiesValue = book._count.copies;
    } else if (book.copies) {
      if (typeof book.copies === "number") {
        copiesValue = book.copies;
      } else if (Array.isArray(book.copies)) {
        copiesValue = book.copies.length;
      } else if (typeof book.copies === "object" && book.copies.total) {
        copiesValue = book.copies.total;
      }
    }
    setCopies(copiesValue);

    // Set semester and existing ebook name
    setSemester(semesterValue);
    setExistingSemester(semesterValue);
    setExistingEbookName(ebookFileName);
    setShelfLocation(shelfLocationValue);

    // Handle cover image
    const coverUrl = book.coverImage || book.cover || null;
    setCoverPreview(coverUrl);

    // Reset ebook file selection
    setEbook(null);

    setActiveTab("edit");
  };

  // Handle update book
  const handleUpdate = () => {
    if (!selectedBook) return;
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

    // Only append ebook if a new file is selected
    if (ebook) {
      fd.append("ebook", ebook);
    }

    if (semester) {
      fd.append("semester", semester);
    }
    if (shelfLocation) {
      fd.append("shelfLocation", shelfLocation);
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/books/${selectedBook.id}`, {
          method: "PATCH",
          body: fd,
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to update book");
          return;
        }

        toast.success("Book updated successfully");
        await mutate();
        resetForm();
        setActiveTab("view");
        if (onSuccess) onSuccess();
      } catch (err) {
        toast.error("Something went wrong");
      }
    });
  };

  // Handle delete book
  const handleDeleteBook = async (bookId: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;

    try {
      const res = await fetch(`/api/books/${bookId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete book");
        return;
      }

      toast.success("Book deleted successfully");
      await mutate();
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      {/* Modal Wrapper */}
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh] transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Book Management
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 hidden xs:block">
              Create, view, or edit your books
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 pt-3 sm:px-6 shrink-0">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as "create" | "view" | "edit");
              if (value === "create") resetForm();
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create
              </TabsTrigger>
              <TabsTrigger value="view" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                My Books
              </TabsTrigger>
              <TabsTrigger
                value="edit"
                className="flex items-center gap-2"
                disabled={!selectedBook}
              >
                <Pencil className="w-4 h-4" />
                Edit
              </TabsTrigger>
            </TabsList>

            {/* Create Tab */}
            <TabsContent value="create" className="mt-4">
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
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

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 sm:gap-3 px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setActiveTab("view");
                  }}
                  className="px-4 sm:px-5 h-9 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={pending}
                  className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm transition-all duration-200 px-4 sm:px-5 h-9 text-sm"
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
            </TabsContent>

            {/* View Tab */}
            <TabsContent value="view" className="mt-4">
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {isLoading ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : books.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400">
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
                    {books.map((book: any) => (
                      <div
                        key={book.id}
                        className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 dark:hover:border-blue-800"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            {/* Title with icon */}
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900 dark:text-white text-base truncate">
                                {book.title}
                              </h3>
                              {book.ebook && typeof book.ebook === "object" && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-medium rounded">
                                  <BookOpen className="w-3 h-3" />
                                  PDF
                                </span>
                              )}
                            </div>

                            {/* Author */}
                            <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                              <span className="text-slate-400 dark:text-slate-500">
                                by
                              </span>
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                {typeof book.author === "object"
                                  ? book.author.name
                                  : book.author}
                              </span>
                            </p>

                            {/* Metadata grid */}
                            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                  ISBN
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                                  {book.isbn}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                  Category
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                  {typeof book.category === "object"
                                    ? book.category.name
                                    : book.category}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                  Copies
                                </span>
                                <span className="text-xs text-slate-600 dark:text-slate-400">
                                  {book._count?.copies ||
                                    (Array.isArray(book.copies)
                                      ? book.copies.length
                                      : 0)}
                                </span>
                              </div>
                              {book.publisher && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                    Publisher
                                  </span>
                                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                    {book.publisher}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Description */}
                            {book.description && (
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                                "{book.description}"
                              </p>
                            )}

                            {/* Additional info chips */}
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              {book.copies &&
                                Array.isArray(book.copies) &&
                                book.copies[0]?.shelfLocation && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] rounded-full">
                                    <span className="text-slate-400 dark:text-slate-500">
                                      📍
                                    </span>
                                    {book.copies[0].shelfLocation}
                                  </span>
                                )}
                              {book.ebook &&
                                typeof book.ebook === "object" &&
                                book.ebook.semester && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] rounded-full">
                                    <span className="text-purple-400 dark:text-purple-500">
                                      📚
                                    </span>
                                    {book.ebook.semester}
                                  </span>
                                )}
                              {book.publicationYear && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] rounded-full">
                                  <span className="text-blue-400 dark:text-blue-500">
                                    📅
                                  </span>
                                  {book.publicationYear}
                                </span>
                              )}
                              {book.language && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] rounded-full">
                                  <span className="text-amber-400 dark:text-amber-500">
                                    🌐
                                  </span>
                                  {book.language}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-col gap-1.5 ml-4 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditBook(book)}
                              className="h-8 w-8 p-0 rounded-lg border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group-hover:border-blue-300"
                            >
                              <Pencil className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteBook(book.id)}
                              className="h-8 w-8 p-0 rounded-lg hover:bg-red-600 hover:scale-105 transition-all duration-200"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Edit Tab */}
            <TabsContent value="edit" className="mt-4">
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
                {selectedBook && (
                  <>
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Editing: <strong>{selectedBook.title}</strong>
                      </p>
                      {existingEbookName && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          ✓ Current ebook: {existingEbookName}
                        </p>
                      )}
                      {!existingEbookName && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          No ebook attached. Upload one if needed.
                        </p>
                      )}
                      {existingSemester && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                          📚 Current semester:{" "}
                          <strong>{existingSemester}</strong>
                        </p>
                      )}
                      {!existingSemester && existingEbookName && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          No semester assigned to this ebook
                        </p>
                      )}
                    </div>

                    {/* Ebook and Semester Info Box */}
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        📄 Ebook & Semester Information
                      </p>
                      {existingEbookName ? (
                        <>
                          <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            <strong>File:</strong> {existingEbookName}
                          </p>
                          {existingSemester && (
                            <p className="text-sm text-green-700 dark:text-green-300">
                              <strong>Semester:</strong> {existingSemester}
                            </p>
                          )}
                          {!existingSemester && (
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                              <strong>Semester:</strong> Not assigned
                            </p>
                          )}
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                            Upload a new ebook file to replace it, or update the
                            semester below
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          No ebook attached. Upload one and assign a semester
                          below.
                        </p>
                      )}
                    </div>
                  </>
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

                {/* Show new ebook selection info */}
                {ebook && (
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      📄 New ebook selected: <strong>{ebook.name}</strong>
                    </p>
                    {semester && (
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        📚 With semester: <strong>{semester}</strong>
                      </p>
                    )}
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      This will replace the existing ebook when you update
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 sm:gap-3 px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-xl shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setActiveTab("view");
                  }}
                  className="px-4 sm:px-5 h-9 text-sm"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={pending}
                  className="bg-linear-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-sm transition-all duration-200 px-4 sm:px-5 h-9 text-sm"
                >
                  {pending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 mr-2" />
                      Update Book
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
