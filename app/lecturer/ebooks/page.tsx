"use client";

import { EbooksTab } from "@/components/students/tabs/EbooksTab";
import { useBooksInfinite } from "@/hooks/useBooksInfinite";
import React, { useEffect, useMemo, useRef, useState } from "react";

// Assuming you are also passing view controls down to the existing tab
type ViewMode = "grid" | "list";

const EbookPage = () => {
  // 1. Manage search and view state if they are not coming from a layout context
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const {
    books: liveBooks,
    isLoading,
    error,
    setSize,
    hasMore,
  } = useBooksInfinite("ebook");

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
    if (!el || !hasMore || isLoading) return;

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
  }, [setSize, hasMore, isLoading]);

  // Handle standard callback actions (e.g. clicking a book card)
  const handleBookClick = (book: any) => {
    // Forwarded execution block to trigger your reader or modal logic
    console.log("Book clicked:", book);
  };

  return (
    <div className="w-full">
      {/* 2. Forward your split state and fetched array to the reused component */}
      <EbooksTab
        books={filteredBooks}
        viewMode={viewMode}
        onViewChange={setViewMode}
        onBookClick={handleBookClick}
      />

      {/* 3. Infinite scroll anchor element placed right beneath the tab view layout */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="py-8 text-center text-sm text-muted-foreground"
        >
          {isLoading ? "Loading more ebooks..." : "Scroll down to see more"}
        </div>
      )}
    </div>
  );
};

export default EbookPage;
