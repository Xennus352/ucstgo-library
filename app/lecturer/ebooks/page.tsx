"use client";

import { EbooksTab } from "@/components/students/tabs/EbooksTab";
import { useBooksInfinite } from "@/hooks/useBooksInfinite";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react"; // Match shadcn setup

type ViewMode = "grid" | "list";

const EbookPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Read search state directly from the URL query string
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const {
    books: liveBooks,
    isLoading,
    isValidating,
    error,
    setSize,
    hasMore,
  } = useBooksInfinite("EResources");

  // Filters books automatically based on URL search adjustments
  const filteredBooks = useMemo(() => {
    if (!searchQuery) return liveBooks;
    const q = searchQuery.toLowerCase();

    return liveBooks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author?.name?.toLowerCase().includes(q) ||
        b.publisher?.toLowerCase().includes(q) ||
        b.category?.name?.toLowerCase().includes(q),
    );
  }, [searchQuery, liveBooks]);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || isValidating) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSize((s) => s + 1);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [setSize, hasMore, isValidating]);

  const handleBookClick = (book: any) => {
    console.log("Book clicked:", book);
  };

  // Prevent blank screen flicker or crashing while the infinite list fetches initial entries
  if (isLoading && liveBooks.length === 0) {
    return (
      <div className="w-full min-h-[50vh] flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        <p className="text-sm">Loading eBooks inventory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full text-center py-12 text-destructive">
        <p className="font-semibold">Failed to load eBooks collection.</p>
        <p className="text-xs text-muted-foreground mt-1">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <EbooksTab
        books={filteredBooks}
        viewMode={viewMode}
        onViewChange={setViewMode}
        onBookClick={handleBookClick}
      />

      {hasMore && (
        <div
          ref={loadMoreRef}
          className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading more ebooks...
            </>
          ) : (
            "Scroll down to see more"
          )}
        </div>
      )}
    </div>
  );
};

export default EbookPage;
