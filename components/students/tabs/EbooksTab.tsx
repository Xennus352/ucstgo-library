"use client";

import React from "react";
import { BookGrid } from "../books/BookGrid";
import { BookWithDetails, ViewMode } from "../types";
import { Grid, List } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

interface EbooksTabProps {
  books: BookWithDetails[];
  onBookClick?: (book: BookWithDetails) => void;
  onViewChange?: (view: ViewMode) => void;
  viewMode?: ViewMode;
}

export const EbooksTab: React.FC<EbooksTabProps> = ({
  books,
  onBookClick,
  onViewChange,
  viewMode = "grid",
}) => {
  const ebooks = books.filter((b) => b.ebook !== undefined);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Strict Horizontal Layout: Title & Subtitle Left, Animating Switcher Right */}
      <div className="flex flex-row items-center justify-between gap-4 mb-6 px-1">
        {/* LEFT: Heading + Total Count Subtitle */}
        <div className="space-y-0.5 min-w-0">
          <h2 className="text-sm md:text-base font-bold text-foreground tracking-tight truncate">
            eBooks Collection
          </h2>
          <p className="text-[11px] md:text-xs text-muted-foreground truncate">
            {ebooks.length} available titles
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
                    layoutId="ebooks-view-pill"
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
                    layoutId="ebooks-view-pill"
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

      {/* Animated content fading container for layout switches */}
      <AnimatePresence mode="wait">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15, ease: "easeInOut" }}
        >
          <BookGrid
            books={ebooks}
            variant={viewMode}
            onBookClick={onBookClick}
            showProgress={true}
            showRating={true}
            showAvailability={true}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
