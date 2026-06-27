"use client";

import { EbooksTab } from "@/components/students/tabs/EbooksTab";
import { useBooksInfinite } from "@/hooks/useBooksInfinite";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation"; 
type ViewMode = "grid" | "list";

const EbookPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // 2. Read search state directly from the URL query string
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const {
    books: liveBooks,
    isLoading,
    error,
    setSize,
    hasMore,
  } = useBooksInfinite("ebook");

  // 3. Filters books automatically based on URL search adjustments
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

  const handleBookClick = (book: any) => {
    console.log("Book clicked:", book);
  };

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
          className="py-8 text-center text-sm text-muted-foreground"
        >
          {isLoading ? "Loading more ebooks..." : "Scroll down to see more"}
        </div>
      )}
    </div>
  );
};

export default EbookPage;
