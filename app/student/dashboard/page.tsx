"use client";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { BookOpen, Tablet, Book, User } from "lucide-react";

import {
  BookWithDetails,
  TabConfig,
  TabId,
  ViewMode,
} from "@/components/students/types";

import { BorrowStatus, ReservationStatus } from "@/types/Role";

import { ExploreTab } from "@/components/students/tabs/ExploreTab";
import { EbooksTab } from "@/components/students/tabs/EbooksTab";
import { PhysicalTab } from "@/components/students/tabs/PhysicalTab";
import { ProfileTab } from "@/components/students/tabs/ProfileTab";

import { TopNav } from "@/components/students/layout/TopNav";
import BottomNav from "@/components/students/layout/BottomNav";

// Import your infinite fetching custom hook
import { useBooksInfinite } from "@/hooks/useBooksInfinite"; // Double check your real path here

/* -----------------------------
 SAMPLE DATA
----------------------------- */
const sampleBorrowRecords = [
  {
    id: "b1",
    borrowDate: new Date("2026-06-01"),
    dueDate: new Date("2026-06-15"),
    returnDate: null,
    status: "ACTIVE" as BorrowStatus,
    userId: "1",
    copyId: "c4",
  },
];

const sampleReservations = [
  {
    id: "r1",
    reservedAt: new Date("2026-06-10"),
    status: "ACTIVE" as ReservationStatus,
    userId: "1",
    bookId: "7",
  },
];

const tabsConfig = [
  { id: "Explore", label: "Explorer", icon: BookOpen },
  { id: "eBooks", label: "Ebooks", icon: Tablet },
  { id: "Physical", label: "Books", icon: Book },
  { id: "Profile", label: "Profile", icon: User },
] as const satisfies TabConfig[];

export default function LibraryApp() {
  const [activeTab, setActiveTab] = useState<TabId>("Explore");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");

  /* -----------------------------
    DYNAMIC HOOK INTEGRATION
  ----------------------------- */
  // Convert Tab ID layout states directly into API Query parameters
  const apiType = useMemo(() => {
    if (activeTab === "eBooks") return "ebook";
    if (activeTab === "Physical") return "physical";
    return "all";
  }, [activeTab]);

  // Hook handles dynamic target adjustments automatically
  const {
    books: liveBooks,
    isLoading,
    error,
    setSize,
    hasMore,
  } = useBooksInfinite(apiType);

  /* -----------------------------
    SEARCH FILTER (LOCAL)
  ----------------------------- */
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

  const reservedBooks = useMemo(
    () =>
      filteredBooks.filter(
        (b) =>
          b.isReserved ||
          (b.readingProgress &&
            b.readingProgress > 0 &&
            b.readingProgress < 100),
      ),
    [filteredBooks],
  );

  /* -----------------------------
    INFINITE SCROLL LOGIC
  ----------------------------- */
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting) {
          setSize((s) => s + 1);
        }
      },
      {
        rootMargin: "200px",
      },
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [setSize, hasMore, isLoading, activeTab]); // Reacts appropriately when tabs click over

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleBookClick = useCallback((book: BookWithDetails) => {
    console.log("Clicked book:", book.title, book.id);

    const bookData = book as any;

    // 1. Safely grab the first copy from the copies array
    const physicalOrEbookCopy = bookData.copies?.[0];

    // 2. Look for the file path property inside that copy object.
    // Note: Check if the key inside the copy is 'filePath', 'file', or 'url'
    const rawPath =
      physicalOrEbookCopy?.filePath ||
      physicalOrEbookCopy?.file ||
      physicalOrEbookCopy?.url;

    if (rawPath) {
      // 3. Strip 'public/' from the start of the path so it works in the browser
      const webUrl = rawPath.replace(/^public\//, "/");
      window.open(webUrl, "_blank", "noopener,noreferrer");
    } else {
      console.error(
        "Could not find a valid file path inside book.copies[0]. Check your copy object structure:",
        physicalOrEbookCopy,
      );
    }
  }, []);

  const renderTabContent = useCallback(() => {
    if (isLoading && liveBooks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
          <div className="text-3xl mb-2">📖</div>
          <p className="text-sm font-medium">Loading library...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-center my-6 text-sm">
          ⚠️ <strong>Error:</strong> {error.message}
        </div>
      );
    }

    switch (activeTab) {
      case "Explore":
        return (
          <ExploreTab
            reservedBooks={reservedBooks}
            catalogBooks={filteredBooks}
            onViewChange={setViewMode}
            viewMode={viewMode}
            onBookClick={handleBookClick}
          />
        );

      case "eBooks":
        return (
          <EbooksTab
            books={filteredBooks} // No more local filtering needed! Managed by your database now.
            onViewChange={setViewMode}
            viewMode={viewMode}
            onBookClick={handleBookClick}
          />
        );

      case "Physical":
        return (
          <PhysicalTab
            books={filteredBooks} // Clean, isolated server-side verified copies.
            onViewChange={setViewMode}
            viewMode={viewMode}
            onBookClick={handleBookClick}
          />
        );

      case "Profile":
        return (
          <ProfileTab
            borrowRecords={sampleBorrowRecords as any}
            reservations={sampleReservations as any}
          />
        );

      default:
        return null;
    }
  }, [
    activeTab,
    filteredBooks,
    reservedBooks,
    viewMode,
    handleBookClick,
    isLoading,
    error,
    liveBooks,
  ]);

  return (
    <div className="w-full min-h-screen bg-background text-foreground font-sans antialiased md:pb-12 pb-28 flex flex-col">
      <TopNav
        tabs={tabsConfig as any}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSearch={handleSearch}
        searchValue={searchQuery}
      />

      <main className="w-full px-4 md:px-12 lg:px-16 pt-6 flex-1">
        {renderTabContent()}

        {/* SHOW TRIGGER LOADER ON COMPATIBLE WORKSPACES ACROSS ALL FILTERED TABS */}
        {activeTab !== "Profile" && hasMore && (
          <div
            ref={loadMoreRef}
            className="flex flex-col items-center justify-center py-12"
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-royal rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Finding more books...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors">
                <BookOpen className="h-5 w-5" />
                <span className="text-[10px] font-medium tracking-widest uppercase">
                  Scroll to discover
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      <div className="block md:hidden">
        <BottomNav
          tabs={tabsConfig as any}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>
    </div>
  );
}
