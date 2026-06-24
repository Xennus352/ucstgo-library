"use client";

import React, { useState, useMemo } from "react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface EbooksTabProps {
  books: BookWithDetails[];
  onBookClick?: (book: BookWithDetails) => void;
  onViewChange?: (view: ViewMode) => void;
  viewMode?: ViewMode;
}

const getYearLabel = (yearNum: string) => {
  const yearWords = ["First", "Second", "Third", "Fourth", "Fifth"];
  return (yearWords[parseInt(yearNum) - 1] || `Year ${yearNum}`) + " Year";
};

const formatSemesterLabel = (semKey: string) => {
  const match = semKey.match(/Y(\d+)_SEM(\d+)/);
  if (!match) return semKey.replace("_", " ");
  const [_, year, sem] = match;

  const yearWords = ["FIRST", "SECOND", "THIRD", "FOURTH"];
  const yWord = yearWords[parseInt(year) - 1] || `YEAR ${year}`;

  return `${yWord} YEAR ( ${sem}${sem === "1" ? "ST" : sem === "2" ? "ND" : "RD"} SEM )`;
};

export const EbooksTab: React.FC<EbooksTabProps> = ({
  books,
  onBookClick,
  onViewChange,
  viewMode = "grid",
}) => {
  // Filter states
  const [activeCategoryFilter, setActiveCategoryFilter] =
    useState<string>("all");
  const [activeYearFilter, setActiveYearFilter] = useState<string>("all");
  const [activeSemesterFilter, setActiveSemesterFilter] =
    useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [openYears, setOpenYears] = useState<Record<string, boolean>>(() => {
    const firstYear = Object.keys(
      books.reduce(
        (acc, book) => {
          if (book.ebook) {
            const semKey = book.ebook.semester || "UNASSIGNED";
            const match = semKey.match(/Y(\d+)_SEM\d+/);
            const yearKey = match ? match[1] : "UNASSIGNED";
            acc[yearKey] = true;
          }
          return acc;
        },
        {} as Record<string, boolean>,
      ),
    ).sort()[0];

    return firstYear ? { [firstYear]: true } : {};
  });

  const [openSemesters, setOpenSemesters] = useState<Record<string, boolean>>(
    () => {
      const firstSemester = books.reduce(
        (acc, book) => {
          if (book.ebook) {
            const semKey = book.ebook.semester || "UNASSIGNED";
            if (!acc) return semKey;
          }
          return acc;
        },
        null as string | null,
      );

      return firstSemester ? { [firstSemester]: true } : {};
    },
  );

  // Extract all available years from books
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    books.forEach((book) => {
      if (book.ebook?.semester) {
        const match = book.ebook.semester.match(/Y(\d+)_SEM\d+/);
        if (match) {
          years.add(match[1]);
        }
      }
    });
    return Array.from(years).sort();
  }, [books]);

  // Extract all available semesters from books
  const availableSemesters = useMemo(() => {
    const semesters = new Set<string>();
    books.forEach((book) => {
      if (book.ebook?.semester) {
        semesters.add(book.ebook.semester);
      }
    });
    return Array.from(semesters).sort();
  }, [books]);

  // Get unique semester keys (SEM1, SEM2, etc.)
  const uniqueSemesterTypes = useMemo(() => {
    const types = new Set<string>();
    availableSemesters.forEach((sem) => {
      const match = sem.match(/Y\d+_(SEM\d+)/);
      if (match) {
        types.add(match[1]);
      }
    });
    return Array.from(types).sort();
  }, [availableSemesters]);

  // Define available filter categories
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

  const { ebooksCount, sortedYears, nestedGroups } = useMemo(() => {
    // Apply filters
    let filteredEbooks = books.filter(
      (b) => b.ebook !== null && b.ebook !== undefined,
    );

    // Apply category filter
    if (activeCategoryFilter !== "all") {
      filteredEbooks = filteredEbooks.filter((book) => {
        const category = book.category?.name || "Other";
        return category.toLowerCase() === activeCategoryFilter.toLowerCase();
      });
    }

    // Apply year filter
    if (activeYearFilter !== "all") {
      filteredEbooks = filteredEbooks.filter((book) => {
        const semKey = book.ebook?.semester || "";
        const match = semKey.match(/Y(\d+)_SEM\d+/);
        return match ? match[1] === activeYearFilter : false;
      });
    }

    // Apply semester type filter (e.g., SEM1, SEM2)
    if (activeSemesterFilter !== "all") {
      filteredEbooks = filteredEbooks.filter((book) => {
        const semKey = book.ebook?.semester || "";
        return semKey.includes(activeSemesterFilter);
      });
    }

    type GroupedData = Record<string, Record<string, BookWithDetails[]>>;

    const groups = filteredEbooks.reduce((acc, book) => {
      const semKey = book.ebook?.semester || "UNASSIGNED";
      const match = semKey.match(/Y(\d+)_SEM\d+/);
      const yearKey = match ? match[1] : "UNASSIGNED";

      if (!acc[yearKey]) acc[yearKey] = {};
      if (!acc[yearKey][semKey]) acc[yearKey][semKey] = [];

      acc[yearKey][semKey].push(book);
      return acc;
    }, {} as GroupedData);

    return {
      ebooksCount: filteredEbooks.length,
      sortedYears: Object.keys(groups).sort(),
      nestedGroups: groups,
    };
  }, [books, activeCategoryFilter, activeYearFilter, activeSemesterFilter]);

  const toggleYear = (year: string) => {
    setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleSemester = (semKey: string) => {
    setOpenSemesters((prev) => ({ ...prev, [semKey]: !prev[semKey] }));
  };

  // Get count for each filter category
  const getCategoryCount = (category: string) => {
    return books.filter((b) => {
      if (!b.ebook) return false;
      const cat = b.category?.name || "Other";
      return cat.toLowerCase() === category.toLowerCase();
    }).length;
  };

  // Get count for year
  const getYearCount = (year: string) => {
    return books.filter((b) => {
      if (!b.ebook?.semester) return false;
      const match = b.ebook.semester.match(/Y(\d+)_SEM\d+/);
      return match ? match[1] === year : false;
    }).length;
  };

  // Get count for semester type
  const getSemesterTypeCount = (semType: string) => {
    return books.filter((b) => {
      if (!b.ebook?.semester) return false;
      return b.ebook.semester.includes(semType);
    }).length;
  };

  // Check if any filter is active
  const hasActiveFilters =
    activeCategoryFilter !== "all" ||
    activeYearFilter !== "all" ||
    activeSemesterFilter !== "all";

  // Get active filter count for badge
  const activeFilterCount = [
    activeCategoryFilter !== "all",
    activeYearFilter !== "all",
    activeSemesterFilter !== "all",
  ].filter(Boolean).length;

  // Clear all filters
  const clearAllFilters = () => {
    setActiveCategoryFilter("all");
    setActiveYearFilter("all");
    setActiveSemesterFilter("all");
  };

  // Filter pills component (reusable)
  const FilterPills = ({ className = "" }: { className?: string }) => (
    <div className={`space-y-3 ${className}`}>
      {/* Category Filters */}
      <div>
        <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground mb-2">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-medium">Type:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={activeCategoryFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategoryFilter("all")}
            className="h-7 md:h-8 text-xs md:text-sm rounded-full px-3"
          >
            All
            <Badge
              variant="secondary"
              className="ml-1.5 h-4 min-w-4 px-1 text-[10px]"
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
              className="h-7 md:h-8 text-xs md:text-sm rounded-full px-3"
            >
              {category}
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 min-w-4 px-1 text-[10px]"
              >
                {getCategoryCount(category)}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Year Filters */}
      <div>
        <span className="text-xs md:text-sm text-muted-foreground font-medium mb-2 block">
          Year:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={activeYearFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveYearFilter("all")}
            className="h-7 md:h-8 text-xs md:text-sm rounded-full px-3"
          >
            All Years
          </Button>

          {availableYears.map((year) => (
            <Button
              key={year}
              variant={activeYearFilter === year ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveYearFilter(year)}
              className="h-7 md:h-8 text-xs md:text-sm rounded-full px-3"
            >
              {getYearLabel(year)}
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 min-w-4 px-1 text-[10px]"
              >
                {getYearCount(year)}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Semester Filters */}
      <div>
        <span className="text-xs md:text-sm text-muted-foreground font-medium mb-2 block">
          Semester:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <Button
            variant={activeSemesterFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSemesterFilter("all")}
            className="h-7 md:h-8 text-xs md:text-sm rounded-full px-3"
          >
            All Semesters
          </Button>

          {uniqueSemesterTypes.map((semType) => (
            <Button
              key={semType}
              variant={activeSemesterFilter === semType ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSemesterFilter(semType)}
              className="h-7 md:h-8 text-xs md:text-sm rounded-full px-3"
            >
              {semType.replace("SEM", "Semester ")}
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 min-w-4 px-1 text-[10px]"
              >
                {getSemesterTypeCount(semType)}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-7 md:h-8 text-xs md:text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3 mr-1" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300 w-full max-w-6xl mx-auto overflow-hidden px-3 sm:px-6 lg:px-8 py-4">
      {/* Header Panel */}
      <div className="flex flex-row items-center justify-between gap-3 mb-2 md:mb-4 px-1">
        <div className="space-y-0.5 min-w-0 flex-1">
          <h2 className="text-base md:text-xl font-bold text-foreground tracking-tight truncate">
            eBooks Collection
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground truncate">
            {ebooksCount} available titles
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Filter Button */}
          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden h-8 md:h-9 relative"
              >
                <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1.5 h-4 min-w-4 px-1 text-[10px] absolute -top-1.5 -right-1.5"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] sm:w-[400px] overflow-y-auto"
            >
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <FilterPills />
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="hidden lg:flex h-8 md:h-9 relative"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
            Filters
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1.5 h-4 min-w-4 px-1 text-[10px]"
              >
                {activeFilterCount}
              </Badge>
            )}
            {filtersOpen ? (
              <ChevronUp className="h-3.5 w-3.5 ml-1.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
            )}
          </Button>

          {onViewChange && (
            <Tabs
              value={viewMode}
              onValueChange={(value) => onViewChange(value as ViewMode)}
              className="shrink-0"
            >
              <TabsList className="grid grid-cols-2 h-8 md:h-9 w-20 md:w-28 p-1 bg-muted/60 rounded-lg border border-border/40 relative select-none">
                <TabsTrigger
                  value="grid"
                  className="relative flex items-center justify-center rounded-md transition-colors duration-200 data-[state=active]:text-foreground text-muted-foreground z-10 cursor-pointer shadow-none data-[state=active]:bg-transparent p-1"
                >
                  {viewMode === "grid" && (
                    <motion.div
                      layoutId="ebooks-view-pill"
                      className="absolute inset-0 bg-card rounded-md shadow-xs border border-border/10 -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <Grid className="h-3.5 w-3.5" />
                </TabsTrigger>

                <TabsTrigger
                  value="list"
                  className="relative flex items-center justify-center rounded-md transition-colors duration-200 data-[state=active]:text-foreground text-muted-foreground z-10 cursor-pointer shadow-none data-[state=active]:bg-transparent p-1"
                >
                  {viewMode === "list" && (
                    <motion.div
                      layoutId="ebooks-view-pill"
                      className="absolute inset-0 bg-card rounded-md shadow-xs border border-border/10 -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <List className="h-3.5 w-3.5" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>
      </div>

      {/* Desktop Filter Section (Collapsible) */}
      <div className="hidden lg:block">
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-muted/30 rounded-xl p-4 md:p-5 border border-border/20"
            >
              <FilterPills />
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Main Accordion Flow */}
      <div className="space-y-3 md:space-y-4 w-full">
        {sortedYears.map((yearKey) => {
          const isYearOpen = !!openYears[yearKey];
          const semesterGroup = nestedGroups[yearKey];
          const sortedSemesters = Object.keys(semesterGroup).sort();
          const yearCount = Object.values(semesterGroup).flat().length;

          const yearContentId = `year-content-${yearKey}`;
          const yearHeaderId = `year-header-${yearKey}`;

          return (
            <div
              key={yearKey}
              className="bg-white rounded-xl lg:rounded-2xl border border-muted-foreground/10 shadow-xs overflow-hidden transition-all duration-200 w-full"
            >
              {/* LEVEL 1: Year Accordion Trigger */}
              <Button
                variant="ghost"
                id={yearHeaderId}
                aria-expanded={isYearOpen}
                aria-controls={yearContentId}
                onClick={() => toggleYear(yearKey)}
                className="w-full h-auto flex items-center justify-between px-3 py-3.5 sm:px-4 sm:py-4 md:px-6 md:py-5 text-left cursor-pointer hover:bg-slate-50/80 rounded-none border-b border-muted-foreground/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 select-none gap-2"
              >
                <h3 className="text-sm md:text-base font-bold text-[#1e3a8a] tracking-wide flex items-center gap-2 min-w-0">
                  <span className="truncate">
                    {yearKey === "UNASSIGNED"
                      ? "Other Titles"
                      : getYearLabel(yearKey)}
                  </span>
                  <span className="text-[10px] md:text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold shrink-0">
                    {yearCount}
                  </span>
                </h3>
                <div className="p-1 md:p-1.5 bg-muted/60 rounded-full text-muted-foreground shrink-0">
                  {isYearOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  )}
                </div>
              </Button>

              {/* LEVEL 1 CONTENT WRAPPER */}
              <AnimatePresence initial={false}>
                {isYearOpen && (
                  <motion.div
                    id={yearContentId}
                    role="region"
                    aria-labelledby={yearHeaderId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden bg-[#f8fafc] p-2 sm:p-3 md:p-5 lg:p-6"
                  >
                    <div className="space-y-3 md:space-y-4 w-full">
                      {sortedSemesters.map((semesterKey) => {
                        const semesterBooks = semesterGroup[semesterKey];
                        const isSemOpen = !!openSemesters[semesterKey];
                        const semesterCount = semesterBooks.length;

                        const semContentId = `sem-content-${semesterKey}`;
                        const semHeaderId = `sem-header-${semesterKey}`;

                        return (
                          <div
                            key={semesterKey}
                            className="border border-muted-foreground/10 rounded-lg md:rounded-xl bg-white overflow-hidden shadow-2xs w-full"
                          >
                            {/* LEVEL 2: Semester Accordion Trigger */}
                            <Button
                              variant="ghost"
                              id={semHeaderId}
                              aria-expanded={isSemOpen}
                              aria-controls={semContentId}
                              onClick={() => toggleSemester(semesterKey)}
                              className="w-full h-auto flex items-center justify-between p-3 sm:p-4 bg-slate-50/50 text-left cursor-pointer hover:bg-slate-100/50 rounded-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 select-none gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="bg-[#f5bf35] text-white text-[9px] sm:text-[10px] md:text-xs font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md tracking-wider uppercase shrink-0">
                                  {formatSemesterLabel(semesterKey).replace(
                                    /FIRST YEAR |SECOND YEAR |THIRD YEAR |FOURTH YEAR /g,
                                    "",
                                  )}
                                </span>
                                <span className="text-[10px] sm:text-[11px] md:text-xs font-semibold text-slate-500 shrink-0">
                                  ({semesterCount}{" "}
                                  {semesterCount === 1 ? "book" : "books"})
                                </span>
                              </div>
                              <div className="text-slate-400 shrink-0">
                                {isSemOpen ? (
                                  <ChevronUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                )}
                              </div>
                            </Button>

                            {/* LEVEL 2: Content Grid Window */}
                            <AnimatePresence initial={false}>
                              {isSemOpen && (
                                <motion.div
                                  id={semContentId}
                                  role="region"
                                  aria-labelledby={semHeaderId}
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.2,
                                    ease: "easeInOut",
                                  }}
                                  className="overflow-hidden p-2 sm:p-3 md:p-4 lg:p-5 bg-white border-t border-slate-100 w-full"
                                >
                                  <AnimatePresence mode="wait">
                                    <motion.div
                                      key={viewMode}
                                      initial={{ opacity: 0, y: 4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -4 }}
                                      transition={{ duration: 0.15 }}
                                      className="w-full h-full"
                                    >
                                      <div className="w-full min-w-0">
                                        <BookGrid
                                          books={semesterBooks}
                                          variant={viewMode}
                                          onBookClick={onBookClick}
                                          showProgress={true}
                                          showRating={true}
                                          showAvailability={true}
                                        />
                                      </div>
                                    </motion.div>
                                  </AnimatePresence>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* No results message */}
        {sortedYears.length === 0 && (
          <div className="text-center py-8 md:py-12 text-muted-foreground">
            <Filter className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 opacity-50" />
            <p className="text-base md:text-lg font-medium">No ebooks found</p>
            <p className="text-xs md:text-sm mt-1">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
