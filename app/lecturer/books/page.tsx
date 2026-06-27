"use client";

import { PhysicalTab } from "@/components/students/tabs/PhysicalTab";
import { useBooksInfinite } from "@/hooks/useBooksInfinite";
import React, { useEffect, useMemo, useRef, useState } from "react";

type ViewMode = "grid" | "list";

const PhysicalBooks = () => {
  // 1. Manage search, view controls, and modal state streams
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const {
    books: liveBooks,
    isLoading,
    error,
    setSize,
    hasMore,
    mutate,
  } = useBooksInfinite("physical");

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

  // Handle standard callback actions (e.g. triggering your inventory/checkout drawer)
  const handleBookClick = (book: any) => {
    console.log("Physical book selected:", book);
  };

  return (
    <div className="w-full">
      {/* 2. Pass your split states and filtered array into your existing UI view */}
      <PhysicalTab
        books={filteredBooks}
        viewMode={viewMode}
        onViewChange={setViewMode}
        onBookClick={handleBookClick}
      />

      {/* 3. The infinite scrolling boundary hook layout element */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="py-8 text-center text-sm text-muted-foreground"
        >
          {isLoading
            ? "Loading more physical shelf records..."
            : "Scroll down to see more"}
        </div>
      )}
    </div>
  );
};

export default PhysicalBooks;
