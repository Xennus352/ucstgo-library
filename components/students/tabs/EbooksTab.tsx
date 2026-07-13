"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BookGrid } from "../books/BookGrid";
import { BookWithDetails, ViewMode } from "../types";
import {
  Grid,
  List,
  ChevronUp,
  ChevronDown,
  Filter,
  X,
  SlidersHorizontal,
  BookOpen,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getAllSemesters } from "@/app/actions/semesters";

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
  // Filter states
  const [activeCategoryFilter, setActiveCategoryFilter] =
    useState<string>("all");
  const [activeSemesterFilter, setActiveSemesterFilter] =
    useState<string>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  const [semesters, setSemesters] = useState<
    { id: string; name: string; slug: string }[]
  >([]);

  // Extract all active runtime Semesters dynamically from books data payload
  useEffect(() => {
    async function fetchSemesters() {
      const result = await getAllSemesters();

      if (result.success && result.data) {
        setSemesters(result.data);
      }
    }

    fetchSemesters();
  }, []);

  // Track accordion expand states
  const [openSemesters, setOpenSemesters] = useState<Record<string, boolean>>(
    {},
  );

  // Auto-expand first semester group on mount
  useEffect(() => {
    const firstSem = books.find((b) => (b.ebook as any)?.semester)
      ?.ebook as any;
    const firstSemId = firstSem?.semester?.id || firstSem?.semesterId;
    if (firstSemId) {
      setOpenSemesters((prev) => ({ [firstSemId]: true, ...prev }));
    }
  }, [books]);

  // Auto-expand a semester accordion when it gets explicitly chosen in the filter dropdown
  useEffect(() => {
    if (activeSemesterFilter !== "all") {
      setOpenSemesters((prev) => ({ ...prev, [activeSemesterFilter]: true }));
    }
  }, [activeSemesterFilter]);

  // Extract available filter categories
  const filterCategories = useMemo(() => {
    const categories = new Set<string>();
    books.forEach((book) => {
      if (book.ebook) {
        const category = book.category?.name || "Other";
        categories.add(category);
      }
    });
    return Array.from(categories).sort();
  }, [books]);

  // Filter books based on active criteria and group them by dynamic semester
  const { ebooksCount, groupedSemesters, sortedSemesterIds } = useMemo(() => {
    let filteredEbooks = books.filter(
      (b) => b.ebook !== null && b.ebook !== undefined,
    );

    if (activeCategoryFilter !== "all") {
      filteredEbooks = filteredEbooks.filter((book) => {
        const category = book.category?.name || "Other";
        return category.toLowerCase() === activeCategoryFilter.toLowerCase();
      });
    }

    if (activeSemesterFilter !== "all") {
      filteredEbooks = filteredEbooks.filter((book) => {
        const ebookData = book.ebook as any;
        // Extract ID directly from the embedded semester relational object if root key is missing
        const currentSemId = ebookData?.semester?.id || ebookData?.semesterId;
        return currentSemId === activeSemesterFilter;
      });
    }

    // Grouping by Semester ID
    const groups = filteredEbooks.reduce(
      (acc, book) => {
        const ebookData = book.ebook as any;
        const semId =
          ebookData?.semester?.id || ebookData?.semesterId || "UNASSIGNED";
        if (!acc[semId]) acc[semId] = [];
        acc[semId].push(book);
        return acc;
      },
      {} as Record<string, BookWithDetails[]>,
    );

    // Sort active keys using names fetched from semesters
    const activeKeys = Object.keys(groups).sort((a, b) => {
      if (a === "UNASSIGNED") return 1;
      if (b === "UNASSIGNED") return -1;
      const nameA = semesters.find((s) => s.id === a)?.name || "";
      const nameB = semesters.find((s) => s.id === b)?.name || "";
      return nameA.localeCompare(nameB);
    });

    return {
      ebooksCount: filteredEbooks.length,
      sortedSemesterIds: activeKeys,
      groupedSemesters: groups,
    };
  }, [books, activeCategoryFilter, activeSemesterFilter, semesters]);

  // Track if active filters are applied
  useEffect(() => {
    const hasFilters =
      activeCategoryFilter !== "all" || activeSemesterFilter !== "all";
    setIsFiltered(hasFilters);
  }, [activeCategoryFilter, activeSemesterFilter]);

  const toggleSemester = (semId: string) => {
    setOpenSemesters((prev) => ({ ...prev, [semId]: !prev[semId] }));
  };

  const getCategoryCount = (category: string) => {
    return books.filter((b) => {
      if (!b.ebook) return false;
      const cat = b.category?.name || "Other";
      return cat.toLowerCase() === category.toLowerCase();
    }).length;
  };

  const getSemesterCount = (semId: string) => {
    return books.filter((b) => {
      const ebookData = b.ebook as any;
      return (ebookData?.semester?.id || ebookData?.semesterId) === semId;
    }).length;
  };

  const clearAllFilters = () => {
    setActiveCategoryFilter("all");
    setActiveSemesterFilter("all");
  };

  const ActiveFiltersDisplay = () => {
    const activeFilters = [];

    if (activeCategoryFilter !== "all") {
      const categoryName =
        filterCategories.find(
          (c) => c.toLowerCase() === activeCategoryFilter.toLowerCase(),
        ) || activeCategoryFilter;
      activeFilters.push({
        id: "category",
        label: `Category: ${categoryName}`,
        type: "category",
      });
    }

    if (activeSemesterFilter !== "all") {
      const semName =
        semesters.find((s) => s.id === activeSemesterFilter)?.name ||
        "Selected Semester";
      activeFilters.push({
        id: "semester",
        label: semName,
        type: "semester",
      });
    }

    if (activeFilters.length === 0) return null;

    return (
      <div className="flex flex-wrap items-center gap-1.5 py-1 px-0.5">
        <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">
          Active filters:
        </span>
        {activeFilters.map((filter) => (
          <Badge
            key={filter.id}
            variant="secondary"
            className="flex items-center gap-1 text-xs py-1 px-2.5 bg-primary/5 hover:bg-primary/10 border-primary/10 text-black"
          >
            <span className="text-black">{filter.label}</span>
            <button
              onClick={() => {
                if (filter.type === "category") setActiveCategoryFilter("all");
                if (filter.type === "semester") setActiveSemesterFilter("all");
              }}
              className="hover:text-foreground ml-0.5 text-black hover:text-destructive transition-colors"
              aria-label={`Remove ${filter.type} filter`}
            >
              <X className="h-3 w-3 text-black" />
            </button>
          </Badge>
        ))}
        {activeFilters.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 text-xs text-black hover:text-foreground px-2 hover:bg-destructive/10"
          >
            Clear all
          </Button>
        )}
      </div>
    );
  };

  const FilterPills = () => (
    <div className="flex flex-col gap-5 lg:gap-6">
      {/* Category Section */}
      <div>
        <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground mb-2.5">
          <Filter className="h-3.5 w-3.5 text-black" />
          <span className="font-medium text-black">Category:</span>
        </div>
        <div className="flex flex-wrap lg:flex-col gap-1.5 lg:gap-1">
          <Button
            variant={activeCategoryFilter === "all" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setActiveCategoryFilter("all")}
            className="h-7 md:h-8 lg:h-9 text-xs rounded-full lg:rounded-md px-3 text-black justify-between lg:w-full"
          >
            <span>All Categories</span>
            <Badge
              variant="default"
              className="ml-1.5 h-4 min-w-4 px-1 text-[10px] text-gray-200"
            >
              {books.filter((b) => b.ebook).length}
            </Badge>
          </Button>

          {filterCategories.map((category) => (
            <Button
              key={category}
              variant={
                activeCategoryFilter === category.toLowerCase()
                  ? "default"
                  : "outline"
              }
              size="sm"
              onClick={() => setActiveCategoryFilter(category.toLowerCase())}
              className="h-7 md:h-8 lg:h-9 text-xs rounded-full lg:rounded-md px-3 text-black justify-between lg:w-full"
            >
              <span className="truncate">{category}</span>
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 min-w-4 px-1 text-[10px] text-black"
              >
                {getCategoryCount(category)}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Dynamic Semester Select Dropdown */}
      <div>
        <span className="text-xs md:text-sm text-muted-foreground font-medium mb-2 block text-black">
          Academic Semester:
        </span>
        <Select
          value={activeSemesterFilter}
          onValueChange={setActiveSemesterFilter}
        >
          <SelectTrigger className="w-full h-9 text-sm text-black">
            <SelectValue placeholder="All Semesters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-black">
              All Semesters ({books.filter((b) => b.ebook).length})
            </SelectItem>
            {semesters.map((sem) => (
              <SelectItem key={sem.id} value={sem.id} className="text-black">
                {sem.name} (<span className="italic font-bold"> {getSemesterCount(sem.id)} </span>)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-8 text-sm text-black hover:text-foreground w-full sm:w-auto lg:w-full mt-2"
        >
          <X className="h-3.5 w-3.5 mr-1.5 text-black" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300 w-full max-w-7xl mx-auto overflow-hidden px-3 sm:px-4 lg:px-6 py-4">
      {/* Header Panel */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-row items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0 flex-1">
            <h2 className="text-base md:text-xl lg:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="truncate">EResources Collection</span>
              <Badge
                variant="secondary"
                className="ml-1 text-xs flex-shrink-0 text-black"
              >
                {ebooksCount}
              </Badge>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Responsive Filter trigger sheet */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden h-8 md:h-9 relative text-black"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 sm:mr-1.5 text-black" />
                  <span className="hidden sm:inline text-black">Filters</span>
                  {isFiltered && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[85vh] rounded-t-xl overflow-y-auto px-4 py-6"
              >
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-lg text-black">
                    <Filter className="h-4 w-4 text-black" />
                    Filters
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterPills />
                  <div className="mt-6 flex gap-3">
                    <Button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="flex-1 text-black"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* View toggle */}
            {onViewChange && (
              <Tabs
                value={viewMode}
                onValueChange={(value) => onViewChange(value as ViewMode)}
                className="shrink-0"
              >
                <TabsList className="grid grid-cols-2 h-8 md:h-9 w-16 sm:w-20 md:w-28 p-0.5 bg-muted/60 rounded-lg border border-border/40 relative select-none">
                  <TabsTrigger
                    value="grid"
                    className="relative flex items-center justify-center rounded-md p-1 text-black"
                  >
                    {viewMode === "grid" && (
                      <motion.div
                        layoutId="ebooks-view-pill"
                        className="absolute inset-0 bg-card rounded-md border border-border/10 -z-10"
                      />
                    )}
                    <Grid className="h-3.5 w-3.5 text-black" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="list"
                    className="relative flex items-center justify-center rounded-md p-1 text-black"
                  >
                    {viewMode === "list" && (
                      <motion.div
                        layoutId="ebooks-view-pill"
                        className="absolute inset-0 bg-card rounded-md border border-border/10 -z-10"
                      />
                    )}
                    <List className="h-3.5 w-3.5 text-black" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </div>

        <ActiveFiltersDisplay />
      </div>

      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 lg:items-start">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block sticky top-6 bg-muted/20 rounded-xl p-5 border border-border/20 self-start">
          <h3 className="font-semibold text-sm mb-4 text-black flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filter Framework
          </h3>
          <FilterPills />
        </aside>

        {/* RESULTS ACCORDION WINDOW */}
        <div className="space-y-4 md:space-y-6">
          <div className="space-y-3 md:space-y-4 w-full">
            {sortedSemesterIds.map((semId) => {
              const semesterBooks = groupedSemesters[semId];
              const isSemOpen = !!openSemesters[semId];
              const semesterCount = semesterBooks.length;

              const semName =
                semesters.find((s) => s.id === semId)?.name ||
                "General Titles / Unassigned";
              const semContentId = `sem-content-${semId}`;
              const semHeaderId = `sem-header-${semId}`;

              return (
                <div
                  key={semId}
                  className="bg-white dark:bg-gray-950 rounded-xl border border-muted-foreground/10 shadow-xs overflow-hidden w-full"
                >
                  {/* Unified Dynamic Semester Accordion Trigger */}
                  <Button
                    variant="ghost"
                    id={semHeaderId}
                    aria-expanded={isSemOpen}
                    aria-controls={semContentId}
                    onClick={() => toggleSemester(semId)}
                    className="w-full h-auto flex items-center justify-between px-4 py-4 md:px-6 md:py-5 text-left cursor-pointer hover:bg-slate-50 border-b border-muted-foreground/5 gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="bg-[#f5bf35] text-white text-[10px] md:text-xs font-extrabold px-2.5 py-1 rounded-md tracking-wider uppercase shrink-0">
                        {semName}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 shrink-0">
                        ({semesterCount}{" "}
                        {semesterCount === 1 ? "book" : "books"})
                      </span>
                    </div>
                    <div className="p-1.5 bg-muted/60 rounded-full text-muted-foreground shrink-0">
                      {isSemOpen ? (
                        <ChevronUp className="h-4 w-4 text-black" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-black" />
                      )}
                    </div>
                  </Button>

                  {/* Level Content Display Grid */}
                  <AnimatePresence initial={false}>
                    {isSemOpen && (
                      <motion.div
                        id={semContentId}
                        role="region"
                        aria-labelledby={semHeaderId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="overflow-hidden p-3 md:p-5 bg-[#f8fafc] dark:bg-gray-900/50"
                      >
                        <BookGrid
                          books={semesterBooks}
                          variant={viewMode}
                          onBookClick={onBookClick}
                          showProgress={true}
                          showRating={true}
                          showAvailability={true}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* Empty state component fallback */}
            {sortedSemesterIds.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-4 opacity-40 text-black" />
                <p className="font-medium text-black">
                  No eBooks matched your configuration
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
