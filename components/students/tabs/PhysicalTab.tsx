"use client";

import React, { useState, useMemo } from "react";
import { BookGrid } from "../books/BookGrid";
import { BookWithDetails, ViewMode } from "../types";
import { Grid, List, Layers, User as UserIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useCategories } from "@/hooks/use-categories";

interface PhysicalTabProps {
  books: BookWithDetails[];
  onBookClick?: (book: BookWithDetails) => void;
  onViewChange?: (view: ViewMode) => void;
  viewMode?: ViewMode;
}

export const PhysicalTab: React.FC<PhysicalTabProps> = ({
  books,
  onBookClick,
  onViewChange,
  viewMode = "grid",
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("All");

  // 1. Fetch categories using your SWR hook
  const { data: categoryResponse } = useCategories();

  const physicalBooks = books.filter((b) => b.copies && b.copies.length > 0);

  // 2. Format categories list safely from API structure
  const categories = useMemo(() => {
    if (!categoryResponse?.data || !Array.isArray(categoryResponse.data)) {
      return ["All"];
    }
    return ["All", ...categoryResponse.data.map((cat: any) => cat.name)];
  }, [categoryResponse]);

  // 3. Extract authors dynamically from available physical books
  const authors = useMemo(() => {
    const uniqueAuthors = new Set<string>();
    physicalBooks.forEach((book) => {
      if (book.author?.name) {
        uniqueAuthors.add(book.author.name);
      }
    });
    return ["All", ...Array.from(uniqueAuthors)];
  }, [physicalBooks]);

  // 4. Calculate item counts for each category dynamically
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: physicalBooks.length,
    };

    physicalBooks.forEach((book) => {
      const catName = book.category?.name;
      if (catName) {
        counts[catName] = (counts[catName] || 0) + 1;
      }
    });

    return counts;
  }, [physicalBooks]);

  // 5. Calculate item counts for each author dynamically
  const authorCounts = useMemo(() => {
    const counts: Record<string, number> = {
      All: physicalBooks.length,
    };

    physicalBooks.forEach((book) => {
      const authorName = book.author?.name;
      if (authorName) {
        counts[authorName] = (counts[authorName] || 0) + 1;
      }
    });

    return counts;
  }, [physicalBooks]);

  // 6. Filter down books based on both category and author selections
  const filteredBooks = useMemo(() => {
    return physicalBooks.filter((b) => {
      const matchesCategory =
        selectedCategory === "All" || b.category?.name === selectedCategory;
      const matchesAuthor =
        selectedAuthor === "All" || b.author?.name === selectedAuthor;
      return matchesCategory && matchesAuthor;
    });
  }, [selectedCategory, selectedAuthor, physicalBooks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header Row */}
      <div className="flex flex-row items-center justify-between gap-4 px-1">
        <div className="space-y-0.5 min-w-0">
          <h2 className="text-sm md:text-base font-bold text-foreground tracking-tight truncate">
            Physical Books
          </h2>
          <p className="text-[11px] md:text-xs text-muted-foreground truncate">
            {filteredBooks.length} matches found
          </p>
        </div>

        {/* View Switcher Toggle */}
        {onViewChange && (
          <Tabs
            value={viewMode}
            onValueChange={(value) => onViewChange(value as ViewMode)}
            className="shrink-0"
          >
            <TabsList className="grid grid-cols-2 h-9 w-37.5 md:w-42.5 p-1 bg-muted/60 rounded-xl border border-border/40 relative select-none">
              <TabsTrigger
                value="grid"
                className="relative flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg transition-colors duration-200 data-[state=active]:text-foreground text-muted-foreground z-10 cursor-pointer shadow-none data-[state=active]:bg-transparent"
              >
                {viewMode === "grid" && (
                  <motion.div
                    layoutId="physical-view-pill"
                    className="absolute inset-0 bg-card rounded-lg shadow-xs border border-border/10 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Grid className="h-3.5 w-3.5" />
                <span>Grid</span>
              </TabsTrigger>

              <TabsTrigger
                value="list"
                className="relative flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg transition-colors duration-200 data-[state=active]:text-foreground text-muted-foreground z-10 cursor-pointer shadow-none data-[state=active]:bg-transparent"
              >
                {viewMode === "list" && (
                  <motion.div
                    layoutId="physical-view-pill"
                    className="absolute inset-0 bg-card rounded-lg shadow-xs border border-border/10 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <List className="h-3.5 w-3.5" />
                <span>List</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Responsive Two-Column Grid Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT COLUMN: Categories Filter Only */}
        <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-6">
          {categories.length > 1 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                <Layers className="h-3.5 w-3.5" /> Categories
              </h3>
              <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none select-none">
                {categories.map((category) => {
                  const isActive = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`
                        w-auto lg:w-full flex items-center justify-between gap-3 px-3.5 py-2 text-xs font-medium rounded-xl 
                        transition-all duration-200 ease-out whitespace-nowrap cursor-pointer backdrop-blur-sm border
                        ${
                          isActive
                            ? "bg-linear-to-r from-primary to-primary/80 text-primary-foreground border-transparent shadow-md shadow-primary/20 font-semibold scale-[1.02]"
                            : "bg-background/50 text-muted-foreground border-border/40 hover:text-foreground hover:bg-accent/50 hover:border-border"
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span>
                          {category === "All"
                            ? "✨"
                            : category === "Popular"
                              ? "🔥"
                              : category === "New"
                                ? "🚀"
                                : category === "Featured"
                                  ? "⭐"
                                  : "📚"}
                        </span>
                        <span>{category}</span>
                      </div>
                      {categoryCounts[category] !== undefined && (
                        <span
                          className={`
                            text-[10px] px-1.5 py-0.5 rounded-md min-w-[20px] text-center
                            ${isActive ? "bg-primary-foreground/20 text-primary-foreground font-bold" : "bg-muted text-muted-foreground"}
                          `}
                        >
                          {categoryCounts[category]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT COLUMN: Author Filter & Book Results Grid */}
        <main className="flex-1 w-full min-w-0 space-y-6">
          {/* Author Filter Row */}
          <div className="space-y-2 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
              <UserIcon className="h-3.5 w-3.5" /> Authors
            </h3>
            <div className="flex flex-row gap-1.5 overflow-x-auto pb-2 scrollbar-none select-none max-w-full">
              {authors.map((author) => {
                const isActive = selectedAuthor === author;
                return (
                  <button
                    key={author}
                    onClick={() => setSelectedAuthor(author)}
                    className={`
            flex items-center justify-between gap-3 px-3.5 py-2 text-xs font-medium rounded-xl 
            transition-all duration-200 ease-out whitespace-nowrap cursor-pointer backdrop-blur-sm border shrink-0
            ${
              isActive
                ? "bg-linear-to-r from-primary to-primary/80 text-primary-foreground border-transparent shadow-md shadow-primary/20 font-semibold scale-[1.02]"
                : "bg-background/50 text-muted-foreground border-border/40 hover:text-foreground hover:bg-accent/50 hover:border-border"
            }
          `}
                  >
                    <span>{author === "All" ? "All Authors" : author}</span>

                    {/* Dynamic Book Count Badge */}
                    {authorCounts[author] !== undefined && (
                      <span
                        className={`
                text-[10px] px-1.5 py-0.5 rounded-md min-w-[20px] text-center transition-colors
                ${
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground font-bold"
                    : "bg-muted text-muted-foreground"
                }
              `}
                      >
                        {authorCounts[author]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Results Grid Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewMode}-${selectedCategory}-${selectedAuthor}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
            >
              <BookGrid
                books={filteredBooks}
                variant={viewMode}
                onBookClick={onBookClick}
                showLocation={true}
                showRating={true}
                showAvailability={true}
              />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
