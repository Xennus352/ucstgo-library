"use client";

import React, { useState, useMemo } from "react";
import { BookGrid } from "../books/BookGrid";
import { BookWithDetails, ViewMode } from "../types";
import { Grid, List } from "lucide-react";
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

  // 2.5 Calculate item counts for each category dynamically
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

  // 3. Filter down books based on selection
  const filteredBooks = useMemo(() => {
    if (selectedCategory === "All") return physicalBooks;
    return physicalBooks.filter((b) => b.category?.name === selectedCategory);
  }, [selectedCategory, physicalBooks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Strict Horizontal Layout: Title Left, Animated Switcher Right */}
      <div className="flex flex-row items-center justify-between gap-4 mb-6 px-1">
        {/* LEFT: Heading + Total Count Subtitle */}
        <div className="space-y-0.5 min-w-0">
          <h2 className="text-sm md:text-base font-bold text-foreground tracking-tight truncate">
            Physical Books
          </h2>
          <p className="text-[11px] md:text-xs text-muted-foreground truncate">
            {filteredBooks.length} available copies
          </p>
        </div>

        {/* RIGHT: Modern Tabs Selector with Smooth Sliding Pill */}
        {onViewChange && (
          <Tabs
            value={viewMode}
            onValueChange={(value) => onViewChange(value as ViewMode)}
            className="shrink-0"
          >
            <TabsList className="grid grid-cols-2 h-9 w-37.5 md:w-42.5 p-1 bg-muted/60 rounded-xl border border-border/40 relative select-none">
              {/* GRID TRIGGER */}
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

              {/* LIST TRIGGER */}
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

      {/* HORIZONTAL CATEGORY ROW (Directly below switcher row) */}
      {categories.length > 1 && (
        <div
          className="
  flex items-center gap-2 overflow-x-auto pb-3 -mt-2 px-1 select-none py-2 scroll-smooth

  /* Firefox scrollbar */
  [scrollbar-width:thin]
  [scrollbar-color:theme(colors.blue.400) theme(colors.blue.300)]

  /* Chrome / Safari scrollbar */
  [&::-webkit-scrollbar]:h-1
  [&::-webkit-scrollbar-track]:bg-blue-300
  [&::-webkit-scrollbar-track]:rounded-full
  [&::-webkit-scrollbar-thumb]:bg-blue-400
  [&::-webkit-scrollbar-thumb]:rounded-full
  hover:[&::-webkit-scrollbar-thumb]:bg-blue-400/70
"
        >
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
            relative px-4 py-2 text-sm font-medium rounded-full 
            transition-all duration-300 ease-out 
            whitespace-nowrap cursor-pointer
            backdrop-blur-sm
            ${
              isActive
                ? "bg-linear-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 scale-105 font-semibold"
                : "bg-background/50 text-muted-foreground hover:text-foreground hover:bg-accent/50 hover:scale-105 border border-border/50"
            }
          `}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </span>
                )}

                {/* Category emoji/icon  enhancement */}
                <span className="mr-1.5">
                  {category === "All"
                    ? "✨"
                    : category === "Popular"
                      ? "🔥"
                      : category === "New"
                        ? "🆕"
                        : category === "Featured"
                          ? "⭐"
                          : ""}
                </span>
                {/* Category text */}
                <span>{category}</span>

                {/* Clean, dynamic count badge */}
                {categoryCounts[category] !== undefined && (
                  <span
                    className={`
      ml-2 text-[10px] px-1.5 py-0.5 rounded-md transition-colors duration-300
      ${
        isActive
          ? "bg-primary-foreground/20 text-primary-foreground font-bold"
          : "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
      }
    `}
                  >
                    {categoryCounts[category]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Animated content fading container for layout switches */}
      <AnimatePresence mode="wait">
        {/* Dynamic combined key guarantees smooth fading when changing categories OR grid layouts */}
        <motion.div
          key={`${viewMode}-${selectedCategory}`}
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
    </div>
  );
};
