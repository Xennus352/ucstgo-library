// hooks/use-lecturer-books.ts
import { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "./use-current-user";

interface Book {
  id: string;
  isbn: string;
  title: string;
  coverImage: string | null;
  language: string | null;
  publicationYear: number | null;
  donate: boolean;
  createdAt: Date;
  
  author: {
    id: string;
    name: string;
  };
  category: {
    id: string;
    name: string;
  };
  copies: Array<{
    id: string;
    barcode: string;
    shelfLocation: string | null;
    status: string;
  }>;
  ebook: {
    id: string;
    format: string;
    filePath: string;
    semester: string;
  } | null;
  _count: {
    copies: number;
    reservations: number;
  };
  status: "available" | "borrowed" | "unavailable";
  availability: {
    available: number;
    borrowed: number;
    total: number;
    isAvailable: boolean;
  };
}

interface UseLecturerBooksReturn {
  books: Book[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  totalPages: number;
  currentPage: number;
  totalBooks: number;
  goToPage: (page: number) => void;
  searchBooks: (query: string) => void;
}

export const useLecturerBooks = (): UseLecturerBooksReturn => {
  const { user } = useCurrentUser();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 10;

  const fetchBooks = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        type: "all", // Get all books (both ebook and physical)
      });

      if (searchQuery) {
        params.append("q", searchQuery);
      }

      // Only fetch books uploaded by this lecturer
      // We'll filter by lecturerId in the API or add a new param
      params.append("lecturerId", user.id);

      const response = await fetch(`/api/books?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch books");
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch books");
      }

      // Filter books to only show those uploaded by the lecturer
      // If your API doesn't support lecturerId filtering, filter here
      const lecturerBooks = result.data.filter(
        (book: any) => book.lecturerId === user.id
      );

      setBooks(lecturerBooks);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalBooks(result.pagination?.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
      console.error("Error fetching lecturer books:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, currentPage, searchQuery, limit]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const refetch = useCallback(async () => {
    await fetchBooks();
  }, [fetchBooks]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const searchBooks = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page on new search
  }, []);

  return {
    books,
    isLoading,
    error,
    refetch,
    totalPages,
    currentPage,
    totalBooks,
    goToPage,
    searchBooks,
  };
};