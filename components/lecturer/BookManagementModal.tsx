// components/lecturer/BookManagementModal.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Book,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  FileText,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useLecturerBooks } from "@/hooks/use-lecturer-books";
import { toast } from "sonner";
import CreateBookModal from "./CreateBookModal"; // Import your existing CreateBookModal

interface BookManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const BookManagementModal: React.FC<BookManagementModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    books,
    isLoading,
    error,
    refetch,
    totalPages,
    currentPage,
    totalBooks,
    goToPage,
    searchBooks,
  } = useLecturerBooks();

  const [activeTab, setActiveTab] = useState<"my-books" | "upload">("my-books");
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Refresh books when modal opens
  useEffect(() => {
    if (isOpen) {
      refetch();
    }
  }, [isOpen, refetch]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchBooks(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchBooks]);

  const handleDeleteBook = async (bookId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this book? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setDeletingId(bookId);
      const response = await fetch(`/api/lecturer/books/${bookId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete book");
      }

      toast.success("Book deleted successfully");
      await refetch();
      onSuccess?.();
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete book",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditBook = (bookId: string) => {
    // Navigate to edit page or open edit modal
    // For now, we'll just show a toast
    toast.info("Edit functionality coming soon");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "borrowed":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "unavailable":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const handleBookCreated = () => {
    // Refresh the book list after a new book is created
    refetch();
    // Switch back to "My Books" tab
    setActiveTab("my-books");
    // Call the onSuccess callback if provided
    onSuccess?.();
    toast.success("Book uploaded successfully!");
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              My Book Collection
            </DialogTitle>
            <DialogDescription>
              Manage your uploaded books, view their status, and upload new ones
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as any)}
            className="mt-4"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="my-books" className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                My Books
                {!isLoading && totalBooks > 0 && (
                  <span className="ml-1 text-xs bg-muted px-2 py-0.5 rounded-full">
                    {totalBooks}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Upload New Book
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-books" className="mt-4 space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by title, author, or ISBN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Refresh"
                  )}
                </Button>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Error State */}
              {error && !isLoading && (
                <div className="text-center py-12 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">
                    Failed to Load Books
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                    {error.message}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => refetch()}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {/* Books Grid */}
              {!isLoading && !error && (
                <>
                  {books.length === 0 ? (
                    <div className="text-center py-16 bg-muted/20 rounded-xl border border-dashed border-border/60">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-sm font-semibold text-foreground">
                        {searchTerm
                          ? "No Books Found"
                          : "No Books Uploaded Yet"}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        {searchTerm
                          ? "No books match your search criteria"
                          : "Upload your first book to start building your collection"}
                      </p>
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-4"
                          onClick={() => setSearchTerm("")}
                        >
                          Clear Search
                        </Button>
                      )}
                      {!searchTerm && (
                        <Button
                          className="mt-4"
                          onClick={() => setActiveTab("upload")}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Upload Your First Book
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {books.map((book) => (
                          <div
                            key={book.id}
                            className="group border border-border/60 rounded-xl p-4 hover:shadow-lg transition-all duration-200 bg-card hover:border-primary/20"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1 min-w-0">
                                {/* Title */}
                                <h4 className="font-semibold text-sm text-foreground line-clamp-1">
                                  {book.title}
                                </h4>

                                {/* Author */}
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  by {book.author.name}
                                </p>

                                {/* ISBN */}
                                <p className="text-xs text-muted-foreground">
                                  ISBN: {book.isbn}
                                </p>

                                {/* Category & Type */}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  {book.category && (
                                    <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/10">
                                      {book.category.name}
                                    </span>
                                  )}
                                  {book.ebook ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                      <FileText className="h-2.5 w-2.5" />
                                      E-Book
                                      {book.ebook.semester && (
                                        <span className="ml-0.5">
                                          • {book.ebook.semester}
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                      <Book className="h-2.5 w-2.5" />
                                      Physical
                                    </span>
                                  )}
                                </div>

                                {/* Status & Copies */}
                                <div className="flex items-center gap-3 mt-2 text-xs">
                                  <span className="text-muted-foreground">
                                    Copies: {book._count.copies}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-medium ${getStatusColor(book.status)}`}
                                  >
                                    {book.status.charAt(0).toUpperCase() +
                                      book.status.slice(1)}
                                  </span>
                                </div>

                                {/* Availability */}
                                {book.availability && (
                                  <div className="flex items-center gap-3 mt-1 text-xs">
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      Available: {book.availability.available}
                                    </span>
                                    <span className="text-blue-600 dark:text-blue-400">
                                      Borrowed: {book.availability.borrowed}
                                    </span>
                                  </div>
                                )}

                                {/* Upload Date */}
                                <p className="text-[10px] text-muted-foreground mt-2">
                                  Uploaded:{" "}
                                  {new Date(book.createdAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-1 ml-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                  onClick={() => handleEditBook(book.id)}
                                >
                                  <Edit className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-950/30"
                                  onClick={() => handleDeleteBook(book.id)}
                                  disabled={deletingId === book.id}
                                >
                                  {deletingId === book.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 border-t border-border/40">
                          <p className="text-sm text-muted-foreground">
                            Showing {books.length} of {totalBooks} books
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => goToPage(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => goToPage(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="upload" className="mt-4">
              {/* Integrate your existing CreateBookModal here */}
              <div className="bg-muted/20 rounded-xl border border-dashed border-border/60 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Upload New Book
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fill in the details below to add a new book to your
                      collection
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("my-books")}
                  >
                    Cancel
                  </Button>
                </div>

                {/* Render your CreateBookModal content here */}
                {/* Since CreateBookModal is a modal itself, we need to adapt it */}
                <div className="mt-2">
                  <Button
                    className="w-full"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Open Upload Form
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Click the button above to open the book upload form
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* CreateBookModal - rendered outside the main dialog */}
      <CreateBookModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          // Optionally switch back to my-books tab
          setActiveTab("my-books");
        }}
        onSuccess={handleBookCreated}
      />
    </>
  );
};

export default BookManagementModal;
