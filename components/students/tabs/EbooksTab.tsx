"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BookGrid } from "../books/BookGrid";
import { BookWithDetails, ViewMode } from "../types";
import {
  Grid,
  List,
  BookOpen,
  GraduationCap,
  FlaskConical,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
  X,
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
  sectionFilter?: "academic" | "research" | "public";
  isLoggedIn?: boolean;
}

type SubCategoryKey =
  | "textbook_reference"
  | "old_question"
  | "other_academic"
  | "thesis"
  | "publication"
  | "other_research"
  | "general_reading"
  | "computer_basics"
  | "fiction"
  | "other_public"
  | "all";

interface SubCategoryItem {
  key: SubCategoryKey;
  label: string;
  section: "academic" | "research" | "public";
}

const ACADEMIC_SUBS: SubCategoryItem[] = [
  {
    key: "textbook_reference",
    label: "Text Book & Reference Book",
    section: "academic",
  },
  { key: "old_question", label: "Old Question", section: "academic" },
  { key: "other_academic", label: "Others", section: "academic" },
];

const RESEARCH_SUBS: SubCategoryItem[] = [
  { key: "thesis", label: "Theses", section: "research" },
  {
    key: "publication",
    label: "Publication / Research Paper",
    section: "research",
  },
  { key: "other_research", label: "Others", section: "research" },
];

const PUBLIC_SUBS: SubCategoryItem[] = [
  { key: "general_reading", label: "General Reading", section: "public" },
  { key: "computer_basics", label: "Computer Basics", section: "public" },
  { key: "fiction", label: "Fiction & Literature", section: "public" },
  { key: "other_public", label: "Others", section: "public" },
];

const ALL_SUBS: SubCategoryItem[] = [...ACADEMIC_SUBS, ...RESEARCH_SUBS, ...PUBLIC_SUBS];

export function mapCategoryToSubCategory(categoryName: string): SubCategoryKey {
  const name = categoryName.toLowerCase();

  if (
    name.includes("textbook") ||
    name.includes("reference") ||
    name.includes("book") ||
    name.includes("syllabus") ||
    name.includes("guide") ||
    name.includes("study material") ||
    name.includes("course material")
  ) {
    return "textbook_reference";
  }

  if (
    name.includes("old question") ||
    name.includes("question bank") ||
    name.includes("exam paper") ||
    name.includes("previous year") ||
    (name.includes("question") && name.includes("old"))
  ) {
    return "old_question";
  }

  if (name.includes("thesis") || name.includes("dissertation")) {
    return "thesis";
  }

  if (
    name.includes("publication") ||
    name.includes("research paper") ||
    name.includes("journal") ||
    (name.includes("paper") &&
      !name.includes("question") &&
      !name.includes("exam"))
  ) {
    return "publication";
  }

  if (
    name.includes("computer") ||
    name.includes("programming") ||
    name.includes("software") ||
    name.includes("coding") ||
    name.includes("it ") ||
    name.includes("technology") ||
    name.includes("web") ||
    name.includes("data")
  ) {
    return "computer_basics";
  }

  if (
    name.includes("general") ||
    name.includes("fiction") ||
    name.includes("novel") ||
    name.includes("biography") ||
    name.includes("history") ||
    name.includes("culture") ||
    name.includes("art") ||
    name.includes("literature") ||
    name.includes("story") ||
    name.includes("public")
  ) {
    return "general_reading";
  }

  const { main } = getSectionForCategory(categoryName);
  if (main === "public") return "other_public";
  return main === "academic" ? "other_academic" : "other_research";
}

function getSectionForCategory(categoryName: string): {
  main: "academic" | "research" | "public";
} {
  const name = categoryName.toLowerCase();

  if (
    name.includes("textbook") ||
    name.includes("reference") ||
    name.includes("book") ||
    name.includes("syllabus") ||
    name.includes("guide") ||
    name.includes("study material") ||
    name.includes("course material")
  ) {
    return { main: "academic" };
  }

  if (
    name.includes("old question") ||
    name.includes("question bank") ||
    name.includes("exam paper") ||
    name.includes("previous year") ||
    (name.includes("question") && name.includes("old"))
  ) {
    return { main: "academic" };
  }

  if (name.includes("thesis") || name.includes("dissertation")) {
    return { main: "research" };
  }

  if (
    name.includes("publication") ||
    name.includes("research paper") ||
    name.includes("journal") ||
    (name.includes("paper") &&
      !name.includes("question") &&
      !name.includes("exam"))
  ) {
    return { main: "research" };
  }

  if (
    name.includes("computer") ||
    name.includes("programming") ||
    name.includes("software") ||
    name.includes("coding") ||
    name.includes("it ") ||
    name.includes("technology") ||
    name.includes("web") ||
    name.includes("data")
  ) {
    return { main: "public" };
  }

  if (
    name.includes("general") ||
    name.includes("fiction") ||
    name.includes("novel") ||
    name.includes("biography") ||
    name.includes("history") ||
    name.includes("culture") ||
    name.includes("art") ||
    name.includes("literature") ||
    name.includes("story") ||
    name.includes("public")
  ) {
    return { main: "public" };
  }

  return { main: "academic" };
}

interface SidebarContentProps {
  activeSubCategory: SubCategoryKey;
  onSubCategoryChange: (key: SubCategoryKey) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
  semesters: { id: string; name: string; slug: string }[];
  activeSemesterFilter: string;
  onSemesterChange: (value: string) => void;
}

function SidebarContent({
  activeSubCategory,
  onSubCategoryChange,
  hasActiveFilters,
  onClearAll,
  semesters,
  activeSemesterFilter,
  onSemesterChange,
  sectionFilter,
}: SidebarContentProps & { sectionFilter?: "academic" | "research" | "public" }) {
  const getSubCategoryCount = (
    key: SubCategoryKey,
    books: BookWithDetails[],
  ) => {
    if (key === "all") return books.length;
    return books.filter((b) => {
      if (!b.ebook) return false;
      const category = b.category?.name || "Other";
      const sub = mapCategoryToSubCategory(category);
      return sub === key;
    }).length;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Academic Resources */}
      {(!sectionFilter || sectionFilter === "academic") && (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <GraduationCap className="h-4 w-4 text-primary" />
            Academic Resources
          </div>
          <div className="space-y-1">
            {ACADEMIC_SUBS.map((sub) => {
              const isActive = activeSubCategory === sub.key;
              const count = getSubCategoryCount(sub.key, []);
              return (
                <button
                  key={sub.key}
                  onClick={() => onSubCategoryChange(isActive ? "all" : sub.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 flex items-center justify-between group ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <span className="truncate">{sub.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Research Resources */}
      {(!sectionFilter || sectionFilter === "research") && (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <FlaskConical className="h-4 w-4 text-primary" />
            Research Resources
          </div>
          <div className="space-y-1">
            {RESEARCH_SUBS.map((sub) => {
              const isActive = activeSubCategory === sub.key;
              const count = getSubCategoryCount(sub.key, []);
              return (
                <button
                  key={sub.key}
                  onClick={() => onSubCategoryChange(isActive ? "all" : sub.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 flex items-center justify-between group ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <span className="truncate">{sub.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Public Resources */}
      {(!sectionFilter || sectionFilter === "public") && (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <BookOpen className="h-4 w-4 text-primary" />
            Public Resources
          </div>
          <div className="space-y-1">
            {PUBLIC_SUBS.map((sub) => {
              const isActive = activeSubCategory === sub.key;
              const count = getSubCategoryCount(sub.key, []);
              return (
                <button
                  key={sub.key}
                  onClick={() => onSubCategoryChange(isActive ? "all" : sub.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 flex items-center justify-between group ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <span className="truncate">{sub.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Year Filter */}
      <div>
        <span className="text-xs font-medium text-muted-foreground mb-2 block">
          Year Filter
        </span>
        <Select value={activeSemesterFilter} onValueChange={onSemesterChange}>
          <SelectTrigger className="w-full h-9 text-sm text-black">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-black">
              All Years
            </SelectItem>
            {semesters.map((sem) => (
              <SelectItem key={sem.id} value={sem.id} className="text-black">
                {sem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="h-8 text-sm text-muted-foreground hover:text-foreground w-full"
        >
          <X className="h-3.5 w-3.5 mr-1.5" />
          Clear All Filters
        </Button>
      )}
    </div>
  );
}

export const EbooksTab: React.FC<EbooksTabProps> = ({
  books,
  onBookClick,
  onViewChange,
  viewMode = "grid",
  sectionFilter,
  isLoggedIn = true,
}) => {
  const [activeSubCategory, setActiveSubCategory] = useState<SubCategoryKey>("all");
  const [activeSemesterFilter, setActiveSemesterFilter] =
    useState<string>("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [semesters, setSemesters] = useState<
    { id: string; name: string; slug: string }[]
  >([]);

  useEffect(() => {
    async function fetchSemesters() {
      const result = await getAllSemesters();
      if (result.success && result.data) {
        setSemesters(result.data);
      }
    }

    fetchSemesters();
  }, []);

  const hasActiveFilters =
    activeSubCategory !== "all" || activeSemesterFilter !== "all";

  const clearAllFilters = () => {
    setActiveSubCategory("all");
    setActiveSemesterFilter("all");
  };

  const filteredBooks = useMemo(() => {
    let result = books.filter((b) => b.ebook !== null && b.ebook !== undefined);

    if (sectionFilter) {
      result = result.filter((book) => {
        const category = book.category?.name || "Other";
        const { main } = getSectionForCategory(category);
        return main === sectionFilter;
      });
    }

    if (activeSubCategory !== "all") {
      result = result.filter((book) => {
        const category = book.category?.name || "Other";
        const sub = mapCategoryToSubCategory(category);
        return sub === activeSubCategory;
      });
    }

    if (activeSemesterFilter !== "all") {
      result = result.filter((book) => {
        const ebookData = book.ebook as any;
        const currentSemId = ebookData?.semester?.id || ebookData?.semesterId;
        return currentSemId === activeSemesterFilter;
      });
    }

    return result;
  }, [books, activeSubCategory, activeSemesterFilter, sectionFilter]);

  const { groupedSemesters, sortedSemesterIds } = useMemo(() => {
    const groups = filteredBooks.reduce(
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

    const activeKeys = Object.keys(groups).sort((a, b) => {
      if (a === "UNASSIGNED") return 1;
      if (b === "UNASSIGNED") return -1;
      const nameA = semesters.find((s) => s.id === a)?.name || "";
      const nameB = semesters.find((s) => s.id === b)?.name || "";
      return nameA.localeCompare(nameB);
    });

    return {
      sortedSemesterIds: activeKeys,
      groupedSemesters: groups,
    };
  }, [filteredBooks, semesters]);

  const [openSemesters, setOpenSemesters] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const firstSem = books.find((b) => (b.ebook as any)?.semester)
      ?.ebook as any;
    const firstSemId = firstSem?.semester?.id || firstSem?.semesterId;
    if (firstSemId) {
      setOpenSemesters((prev) => ({ [firstSemId]: true, ...prev }));
    }
  }, [books]);

  const toggleSemester = (semId: string) => {
    setOpenSemesters((prev) => ({ ...prev, [semId]: !prev[semId] }));
  };

  const getSubCategoryCount = (key: SubCategoryKey) => {
    if (key === "all") return filteredBooks.length;
    return books.filter((b) => {
      if (!b.ebook) return false;
      const category = b.category?.name || "Other";
      const sub = mapCategoryToSubCategory(category);
      return sub === key;
    }).length;
  };

  const sidebar = (
    <div className="flex flex-col gap-6">
      {/* Academic Resources */}
      {(!sectionFilter || sectionFilter === "academic") && (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <GraduationCap className="h-4 w-4 text-primary" />
            Academic Resources
          </div>
          <div className="space-y-1">
            {ACADEMIC_SUBS.map((sub) => {
              const isActive = activeSubCategory === sub.key;
              const count = getSubCategoryCount(sub.key);
              return (
                <button
                  key={sub.key}
                  onClick={() => setActiveSubCategory(isActive ? "all" : sub.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 flex items-center justify-between group ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <span className="truncate">{sub.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Research Resources */}
      {(!sectionFilter || sectionFilter === "research") && (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <FlaskConical className="h-4 w-4 text-primary" />
            Research Resources
          </div>
          <div className="space-y-1">
            {RESEARCH_SUBS.map((sub) => {
              const isActive = activeSubCategory === sub.key;
              const count = getSubCategoryCount(sub.key);
              return (
                <button
                  key={sub.key}
                  onClick={() => setActiveSubCategory(isActive ? "all" : sub.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 flex items-center justify-between group ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <span className="truncate">{sub.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Public Resources */}
      {(!sectionFilter || sectionFilter === "public") && (
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
            <BookOpen className="h-4 w-4 text-primary" />
            Public Resources
          </div>
          <div className="space-y-1">
            {PUBLIC_SUBS.map((sub) => {
              const isActive = activeSubCategory === sub.key;
              const count = getSubCategoryCount(sub.key);
              return (
                <button
                  key={sub.key}
                  onClick={() => setActiveSubCategory(isActive ? "all" : sub.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 flex items-center justify-between group ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground border-l-2 border-transparent"
                  }`}
                >
                  <span className="truncate">{sub.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ml-2 ${
                      isActive
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Year Filter */}
      <div>
        <span className="text-xs font-medium text-muted-foreground mb-2 block">
          Year Filter
        </span>
        <Select
          value={activeSemesterFilter}
          onValueChange={setActiveSemesterFilter}
        >
          <SelectTrigger className="w-full h-9 text-sm text-black">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-black">
              All Years
            </SelectItem>
            {semesters.map((sem) => (
              <SelectItem key={sem.id} value={sem.id} className="text-black">
                {sem.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-8 text-sm text-muted-foreground hover:text-foreground w-full"
        >
          <X className="h-3.5 w-3.5 mr-1.5" />
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
              <Badge variant="secondary" className="ml-1 text-xs flex-shrink-0">
                {filteredBooks.length}
              </Badge>
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile filter trigger */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden h-8 md:h-9 relative text-black"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 sm:mr-1.5 text-black" />
                  <span className="hidden sm:inline text-black">Filters</span>
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="h-[85vh] rounded-r-xl overflow-y-auto px-4 py-6 w-80"
              >
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-lg text-black">
                    <SlidersHorizontal className="h-4 w-4 text-black" />
                    Filters
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6">{sidebar}</div>
              </SheetContent>
            </Sheet>

            {/* Year/Semester Filter */}
            <Select
              value={activeSemesterFilter}
              onValueChange={setActiveSemesterFilter}
            >
              <SelectTrigger className="h-8 md:h-9 text-sm text-black min-w-[140px]">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-black">
                  All Years
                </SelectItem>
                {semesters.map((sem) => (
                  <SelectItem
                    key={sem.id}
                    value={sem.id}
                    className="text-black"
                  >
                    {sem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
      </div>

      {/* Master-Detail Layout using 12-Column Grid (4 cols for Sidebar, 8 cols for Main) */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">
        {/* LEFT SIDEBAR - Expanded column span */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-6 bg-muted/20 rounded-xl p-4 border border-border/20 self-start w-full">
          {sidebar}
        </aside>

        {/* RIGHT MAIN PANEL - Reduced column span */}
        <div className="lg:col-span-8 space-y-4 md:space-y-6 min-w-0">
          {/* Active filter indicator */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 py-1 px-0.5">
              {activeSubCategory !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 text-xs py-1 px-2.5 bg-primary/5 hover:bg-primary/10 border-primary/10 text-black cursor-pointer"
                  onClick={() => setActiveSubCategory("all")}
                >
                  <span className="text-black">
                    {ALL_SUBS.find((s) => s.key === activeSubCategory)?.label}
                  </span>
                  <X className="h-3 w-3 text-black" />
                </Badge>
              )}
              {activeSemesterFilter !== "all" && (
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 text-xs py-1 px-2.5 bg-primary/5 hover:bg-primary/10 border-primary/10 text-black cursor-pointer"
                  onClick={() => setActiveSemesterFilter("all")}
                >
                  <span className="text-black">
                    {semesters.find((s) => s.id === activeSemesterFilter)
                      ?.name || "Selected Year"}
                  </span>
                  <X className="h-3 w-3 text-black" />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 text-xs text-black hover:text-foreground px-2 hover:bg-destructive/10"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Semester Accordion */}
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

            {sortedSemesterIds.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-8 w-8 mx-auto mb-4 opacity-40 text-black" />
                <p className="font-medium text-black">
                  No eBooks matched your selection
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
