"use client";

import React, { useState, useMemo } from "react";
import { BookGrid } from "../books/BookGrid";
import { BookWithDetails, ViewMode } from "../types";
import { Grid, List, ChevronUp, ChevronDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

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
  const [openYears, setOpenYears] = useState<Record<string, boolean>>(() => {
    // Dynamically set first year as open if it exists
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
      // Dynamically set first semester as open if it exists
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

  const { ebooksCount, sortedYears, nestedGroups } = useMemo(() => {
    const filteredEbooks = books.filter(
      (b) => b.ebook !== null && b.ebook !== undefined,
    );

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
  }, [books]);

  const toggleYear = (year: string) => {
    setOpenYears((prev) => ({ ...prev, [year]: !prev[year] }));
  };

  const toggleSemester = (semKey: string) => {
    setOpenSemesters((prev) => ({ ...prev, [semKey]: !prev[semKey] }));
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300 w-full max-w-full overflow-hidden px-2 sm:px-4">
      {/* Header Panel */}
      <div className="flex flex-row items-center justify-between gap-3 mb-2 md:mb-4 px-1">
        <div className="space-y-0.5 min-w-0 flex-1">
          <h2 className="text-sm md:text-base font-bold text-foreground tracking-tight truncate">
            eBooks Collection
          </h2>
          <p className="text-[11px] md:text-xs text-muted-foreground truncate">
            {ebooksCount} available titles
          </p>
        </div>

        {onViewChange && (
          <Tabs
            value={viewMode}
            onValueChange={(value) => onViewChange(value as ViewMode)}
            className="shrink-0"
          >
            <TabsList className="grid grid-cols-2 h-8 md:h-9 w-24 md:w-36 p-1 bg-muted/60 rounded-lg border border-border/40 relative select-none">
              <TabsTrigger
                value="grid"
                className="relative flex items-center justify-center rounded-md transition-colors duration-200 data-[state=active]:text-foreground text-muted-foreground z-10 cursor-pointer shadow-none data-[state=active]:bg-transparent p-1"
              >
                {viewMode === "grid" && (
                  <motion.div
                    layoutId="ebooks-view-pill"
                    className="absolute inset-0 bg-card rounded-md shadow-xs border border-border/10 -z-10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
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
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <List className="h-3.5 w-3.5" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
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
              className="bg-white rounded-xl md:rounded-3xl border border-muted-foreground/10 shadow-2xs overflow-hidden transition-all duration-200 w-full"
            >
              {/* LEVEL 1: Year Accordion Trigger */}
              <Button variant={'outline'}
                id={yearHeaderId}
                aria-expanded={isYearOpen}
                aria-controls={yearContentId}
                onClick={() => toggleYear(yearKey)}
                className="w-full flex items-center justify-between px-4 py-3.5 md:px-5 md:py-4 border-b border-muted-foreground/10 text-left cursor-pointer hover:bg-slate-50/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 select-none gap-2"
              >
                <h3 className="text-sm font-bold text-[#1e3a8a] tracking-wide flex items-center gap-2 min-w-0">
                  <span className="truncate">
                    {yearKey === "UNASSIGNED"
                      ? "Other Titles"
                      : getYearLabel(yearKey)}
                  </span>
                  <span className="text-[10px] md:text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-semibold shrink-0">
                    {yearCount}
                  </span>
                </h3>
                <div className="p-1 md:p-1.5 bg-muted/40 rounded-full text-muted-foreground shrink-0">
                  {isYearOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
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
                    className="overflow-hidden bg-[#f8fafc] p-2 sm:p-4 md:p-5"
                  >
                    <div className="space-y-3 w-full">
                      {sortedSemesters.map((semesterKey) => {
                        const semesterBooks = semesterGroup[semesterKey];
                        const isSemOpen = !!openSemesters[semesterKey];
                        const semesterCount = semesterBooks.length;

                        const semContentId = `sem-content-${semesterKey}`;
                        const semHeaderId = `sem-header-${semesterKey}`;

                        return (
                          <div
                            key={semesterKey}
                            className="border border-muted-foreground/10 rounded-lg md:rounded-2xl bg-white overflow-hidden shadow-3xs w-full"
                          >
                            {/* LEVEL 2: Semester Accordion Trigger */}
                            <Button
                            variant={'outline'}
                              id={semHeaderId}
                              aria-expanded={isSemOpen}
                              aria-controls={semContentId}
                              onClick={() => toggleSemester(semesterKey)}
                              className="w-full flex items-center justify-between p-3 md:px-4 md:py-3 bg-slate-50/70 text-left cursor-pointer hover:bg-slate-100/60 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 select-none gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="bg-[#f5bf35] text-white text-[10px] md:text-xs font-black px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full tracking-wider uppercase shrink-0">
                                  {formatSemesterLabel(semesterKey).replace(
                                    /FIRST YEAR |SECOND YEAR |THIRD YEAR |FOURTH YEAR /g,
                                    "",
                                  )}
                                </span>
                                <span className="text-[11px] md:text-xs font-bold text-slate-400 shrink-0">
                                  ({semesterCount}{" "}
                                  {semesterCount === 1 ? "book" : "books"})
                                </span>
                              </div>
                              <div className="text-slate-400 shrink-0">
                                {isSemOpen ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
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
                                  className="overflow-hidden p-3 md:p-4 bg-white border-t border-slate-100 w-full"
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
                                      {/* BookGrid with centering on small devices */}
                                      <div className="flex justify-center w-full min-w-0 overflow-visible">
                                        <div className="w-full max-w-full">
                                          <BookGrid
                                            books={semesterBooks}
                                            variant={viewMode}
                                            onBookClick={onBookClick}
                                            showProgress={true}
                                            showRating={true}
                                            showAvailability={true}
                                          />
                                        </div>
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
      </div>
    </div>
  );
};
