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

interface EbooksTabProps {
  books: BookWithDetails[];
  onBookClick?: (book: BookWithDetails) => void;
  onViewChange?: (view: ViewMode) => void;
  viewMode?: ViewMode;
}

const getYearLabel = (yearNum: string) => {
  if (yearNum === "MASTER") return "Master's Degree";
  const yearWords = ["First", "Second", "Third", "Fourth", "Fifth"];
  return (yearWords[parseInt(yearNum) - 1] || `Year ${yearNum}`) + " Year";
};

const formatSemesterLabel = (semKey: string) => {
  if (semKey === "MASTER") return "MASTER'S DEGREE";

  const match = semKey.match(/Y(\d+)_SEM(\d+)/);
  if (!match) return semKey.replace("_", " ");
  const [_, year, sem] = match;

  const yearWords = ["FIRST", "SECOND", "THIRD", "FOURTH"];
  const yWord = yearWords[parseInt(year) - 1] || `YEAR ${year}`;

  const getOrdinalSuffix = (numStr: string) => {
    if (numStr === "1") return "ST";
    if (numStr === "2") return "ND";
    if (numStr === "3") return "RD";
    return "TH";
  };

  return `${yWord} YEAR ( ${sem}${getOrdinalSuffix(sem)} SEM )`;
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);

  // Auto-expand first year and semester on mount
  const [openYears, setOpenYears] = useState<Record<string, boolean>>(() => {
    const firstYear = Object.keys(
      books.reduce(
        (acc, book) => {
          if (book.ebook) {
            const semKey = book.ebook.semester || "UNASSIGNED";
            if (semKey === "MASTER") {
              acc["MASTER"] = true;
            } else {
              const match = semKey.match(/Y(\d+)_SEM\d+/);
              const yearKey = match ? match[1] : "UNASSIGNED";
              acc[yearKey] = true;
            }
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
        if (book.ebook.semester === "MASTER") {
          years.add("MASTER");
        } else {
          const match = book.ebook.semester.match(/Y(\d+)_SEM\d+/);
          if (match) {
            years.add(match[1]);
          }
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
      if (sem === "MASTER") return;
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

  // Filter books based on all criteria
  const { ebooksCount, sortedYears, nestedGroups } = useMemo(() => {
    let filteredEbooks = books.filter(
      (b) => b.ebook !== null && b.ebook !== undefined,
    );

    if (activeCategoryFilter !== "all") {
      filteredEbooks = filteredEbooks.filter((book) => {
        const category = book.category?.name || "Other";
        return category.toLowerCase() === activeCategoryFilter.toLowerCase();
      });
    }

    if (activeYearFilter !== "all") {
      filteredEbooks = filteredEbooks.filter((book) => {
        const semKey = book.ebook?.semester || "";
        if (semKey === "MASTER") return activeYearFilter === "MASTER";
        const match = semKey.match(/Y(\d+)_SEM\d+/);
        return match ? match[1] === activeYearFilter : false;
      });
    }

    if (activeSemesterFilter !== "all") {
      filteredEbooks = filteredEbooks.filter((book) => {
        const semKey = book.ebook?.semester || "";
        return semKey.includes(activeSemesterFilter);
      });
    }

    type GroupedData = Record<string, Record<string, BookWithDetails[]>>;

    const groups = filteredEbooks.reduce((acc, book) => {
      const semKey = book.ebook?.semester || "UNASSIGNED";
      let yearKey = "UNASSIGNED";

      if (semKey === "MASTER") {
        yearKey = "MASTER";
      } else {
        const match = semKey.match(/Y(\d+)_SEM\d+/);
        if (match) yearKey = match[1];
      }

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

  // Check if any filter is active
  useEffect(() => {
    const hasFilters =
      activeCategoryFilter !== "all" ||
      activeYearFilter !== "all" ||
      activeSemesterFilter !== "all";
    setIsFiltered(hasFilters);
  }, [activeCategoryFilter, activeYearFilter, activeSemesterFilter]);

  const toggleYear = (year: string) => {
    setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleSemester = (semKey: string) => {
    setOpenSemesters((prev) => ({ ...prev, [semKey]: !prev[semKey] }));
  };

  const getCategoryCount = (category: string) => {
    return books.filter((b) => {
      if (!b.ebook) return false;
      const cat = b.category?.name || "Other";
      return cat.toLowerCase() === category.toLowerCase();
    }).length;
  };

  const getYearCount = (year: string) => {
    return books.filter((b) => {
      if (!b.ebook?.semester) return false;
      if (b.ebook.semester === "MASTER") return year === "MASTER";
      const match = b.ebook.semester.match(/Y(\d+)_SEM\d+/);
      return match ? match[1] === year : false;
    }).length;
  };

  const getSemesterTypeCount = (semType: string) => {
    return books.filter((b) => {
      if (!b.ebook?.semester) return false;
      return b.ebook.semester.includes(semType);
    }).length;
  };

  const activeFilterCount = [
    activeCategoryFilter !== "all",
    activeYearFilter !== "all",
    activeSemesterFilter !== "all",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setActiveCategoryFilter("all");
    setActiveYearFilter("all");
    setActiveSemesterFilter("all");
  };

  const clearFilter = (type: string) => {
    switch (type) {
      case "category":
        setActiveCategoryFilter("all");
        break;
      case "year":
        setActiveYearFilter("all");
        break;
      case "semester":
        setActiveSemesterFilter("all");
        break;
      default:
        break;
    }
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

    if (activeYearFilter !== "all") {
      activeFilters.push({
        id: "year",
        label: `Year: ${getYearLabel(activeYearFilter)}`,
        type: "year",
      });
    }

    if (activeSemesterFilter !== "all") {
      activeFilters.push({
        id: "semester",
        label: activeSemesterFilter.replace("SEM", "Semester "),
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
              onClick={() => clearFilter(filter.type)}
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
            <span>All</span>
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

      {/* Year and Semester Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
        <div>
          <span className="text-xs md:text-sm text-muted-foreground font-medium mb-2 block text-black">
            Year:
          </span>
          <Select value={activeYearFilter} onValueChange={setActiveYearFilter}>
            <SelectTrigger className="w-full h-9 text-sm text-black">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-black">
                All Years ({books.filter((b) => b.ebook).length})
              </SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year} className="text-black">
                  {getYearLabel(year)} ({getYearCount(year)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <span className="text-xs md:text-sm text-muted-foreground font-medium mb-2 block text-black">
            Semester:
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
                All Semesters
              </SelectItem>
              {uniqueSemesterTypes.map((semType) => (
                <SelectItem
                  key={semType}
                  value={semType}
                  className="text-black"
                >
                  {semType.replace("SEM", "Semester ")} (
                  {getSemesterTypeCount(semType)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
              <span className="truncate">eBooks Collection</span>
              <Badge
                variant="secondary"
                className="ml-1 text-xs flex-shrink-0 text-black"
              >
                {ebooksCount}
              </Badge>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile/Tablet Filter Button */}
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
                    {isFiltered && (
                      <Badge variant="secondary" className="ml-auto text-black">
                        {activeFilterCount} active
                      </Badge>
                    )}
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
                    {isFiltered && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          clearAllFilters();
                          setMobileFiltersOpen(false);
                        }}
                        className="flex-1 text-black"
                      >
                        Clear All
                      </Button>
                    )}
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
                    className="relative flex items-center justify-center rounded-md transition-colors duration-200 data-[state=active]:text-foreground text-muted-foreground z-10 cursor-pointer shadow-none data-[state=active]:bg-transparent p-1 text-black"
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
                    <Grid className="h-3.5 w-3.5 text-black" />
                    <span className="sr-only">Grid view</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="list"
                    className="relative flex items-center justify-center rounded-md transition-colors duration-200 data-[state=active]:text-foreground text-muted-foreground z-10 cursor-pointer shadow-none data-[state=active]:bg-transparent p-1 text-black"
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
                    <List className="h-3.5 w-3.5 text-black" />
                    <span className="sr-only">List view</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
        </div>

        {/* Active filters display */}
        <ActiveFiltersDisplay />
      </div>

      {/* Main Multi-Column Split on Desktop */}
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 lg:items-start">
        {/* DESKTOP SIDEBAR FILTER */}
        <aside className="hidden lg:block sticky top-6 bg-muted/20 rounded-xl p-5 border border-border/20 self-start">
          <h3 className="font-semibold text-sm mb-4 text-black flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            Filter Framework
          </h3>
          <FilterPills />
        </aside>

        {/* RESULTS WRAPPER (RIGHT SIDE) */}
        <div className="space-y-4 md:space-y-6">
          {/* Results count indicator */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground border-b pb-2">
            <span className="text-black">
              Showing{" "}
              <span className="font-semibold text-black">{ebooksCount}</span>{" "}
              eBooks
              {isFiltered && <span className="text-black"> (filtered)</span>}
            </span>
            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-7 text-xs text-black hover:text-foreground"
              >
                <X className="h-3 w-3 mr-1 text-black" />
                Clear filters
              </Button>
            )}
          </div>

          {/* Accordion List Flow */}
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
                  className="bg-white dark:bg-gray-950 rounded-xl lg:rounded-2xl border border-muted-foreground/10 shadow-xs overflow-hidden transition-all duration-200 w-full"
                >
                  {/* LEVEL 1: Year Accordion Trigger */}
                  <Button
                    variant="ghost"
                    id={yearHeaderId}
                    aria-expanded={isYearOpen}
                    aria-controls={yearContentId}
                    onClick={() => toggleYear(yearKey)}
                    className="w-full h-auto flex items-center justify-between px-3 py-3.5 sm:px-4 sm:py-4 md:px-6 md:py-5 text-left cursor-pointer hover:bg-slate-50/80 dark:hover:bg-gray-800/50 rounded-none border-b border-muted-foreground/5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary select-none gap-2"
                  >
                    <h3 className="text-sm md:text-base font-bold text-[#1e3a8a] dark:text-blue-400 tracking-wide flex items-center gap-2 min-w-0">
                      <span className="truncate">
                        {yearKey === "UNASSIGNED"
                          ? "Other Titles"
                          : getYearLabel(yearKey)}
                      </span>
                      <span className="text-[10px] md:text-xs bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 px-2 py-0.5 rounded-full font-semibold shrink-0">
                        {yearCount}
                      </span>
                    </h3>
                    <div className="p-1 md:p-1.5 bg-muted/60 rounded-full text-muted-foreground shrink-0">
                      {isYearOpen ? (
                        <ChevronUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-black" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-black" />
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
                        className="overflow-hidden bg-[#f8fafc] dark:bg-gray-900/50 p-2 sm:p-3 md:p-5 lg:p-6"
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
                                className="border border-muted-foreground/10 rounded-lg md:rounded-xl bg-white dark:bg-gray-950 overflow-hidden shadow-2xs w-full"
                              >
                                {/* LEVEL 2: Semester Accordion Trigger */}
                                <Button
                                  variant="ghost"
                                  id={semHeaderId}
                                  aria-expanded={isSemOpen}
                                  aria-controls={semContentId}
                                  onClick={() => toggleSemester(semesterKey)}
                                  className="w-full h-auto flex items-center justify-between p-3 sm:p-4 bg-slate-50/50 dark:bg-gray-800/30 text-left cursor-pointer hover:bg-slate-100/50 dark:hover:bg-gray-800/50 rounded-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary select-none gap-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="bg-[#f5bf35] text-white text-[9px] sm:text-[10px] md:text-xs font-extrabold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md tracking-wider uppercase shrink-0">
                                      {formatSemesterLabel(semesterKey).replace(
                                        /FIRST YEAR |SECOND YEAR |THIRD YEAR |FOURTH YEAR /g,
                                        "",
                                      )}
                                    </span>
                                    <span className="text-[10px] sm:text-[11px] md:text-xs font-semibold text-slate-500 dark:text-gray-400 shrink-0">
                                      ({semesterCount}{" "}
                                      {semesterCount === 1 ? "book" : "books"})
                                    </span>
                                  </div>
                                  <div className="text-slate-400 dark:text-gray-500 shrink-0">
                                    {isSemOpen ? (
                                      <ChevronUp className="h-3.5 w-3.5 md:h-4 md:w-4 text-black" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5 md:h-4 md:w-4 text-black" />
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
                                      className="overflow-hidden p-2 sm:p-3 md:p-4 lg:p-5 bg-white dark:bg-gray-950 border-t border-slate-100 dark:border-gray-800 w-full"
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
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 md:py-16 text-muted-foreground"
              >
                <div className="bg-muted/30 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Filter className="h-8 w-8 opacity-50 text-black" />
                </div>
                <p className="text-base md:text-lg font-medium text-black">
                  No eBooks found
                </p>
                <p className="text-xs md:text-sm mt-1 max-w-sm mx-auto text-black">
                  {isFiltered
                    ? "Try adjusting your filters to find what you are looking for."
                    : "No eBooks are available at this time."}
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
