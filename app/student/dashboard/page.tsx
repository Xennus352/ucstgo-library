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

import { useBooksInfinite } from "@/hooks/useBooksInfinite";
import { toast } from "sonner";
import dynamic from "next/dynamic";

import { PhysicalBookDetailsModal } from "@/components/students/modals/PhysicalBookDetailsModal";

const EbookReaderContainer = dynamic(
  () => import("@/components/reader/EbookReaderContainer"),
  { ssr: false },
);

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

  // 1. ADD STATE LAYER FOR MOUNTING THE SPLIT READER VIEW OVERLAY
  const [activeEbookUrl, setActiveEbookUrl] = useState<string | null>(null);

  // ---  PHYSICAL INVENTORY UI STATE LAYERS ---
  const [selectedPhysicalBook, setSelectedPhysicalBook] =
    useState<BookWithDetails | null>(null);
  const [isPhysicalModalOpen, setIsPhysicalModalOpen] = useState(false);
  const [isReserving, setIsReserving] = useState(false);

  /* -----------------------------
    DYNAMIC HOOK INTEGRATION
  ----------------------------- */
  const apiType = useMemo(() => {
    if (activeTab === "eBooks") return "ebook";
    if (activeTab === "Physical") return "physical";
    return "all";
  }, [activeTab]);

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
  }, [setSize, hasMore, isLoading, activeTab]);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // --- ACTION TO SUBMIT PHYSICAL SYSTEM RESERVATION HOLD ---
  const handleReserveBook = async (bookId: string) => {
    try {
      setIsReserving(true);
      const response = await fetch("/api/reservations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(
          json.error || "Could not process reservation hold request.",
        );
      }

      toast.success(
        "Reservation successful! Collect your item from the library desk.",
      );
      setIsPhysicalModalOpen(false);
      setSelectedPhysicalBook(null);
    } catch (err: any) {
      toast.error(
        err.message ||
          "An unexpected error occurred while placing reservation.",
      );
    } finally {
      setIsReserving(false);
    }
  };

  //  RECONSTRUCT THE SELECTION TO ROUTE IN-APP VIA REACT STATE
  const handleBookClick = useCallback(
    async (book: BookWithDetails) => {
      console.log("Clicked book:", book.title, book.id);

      const bookData = book as any;
      const rawPath = bookData.ebook?.filePath;

      // Route Variant A: Digital format match -> launch virtual reading interface canvas
      if (activeTab === "eBooks" || rawPath) {
        if (rawPath) {
          const cleanPath = rawPath.startsWith("http")
            ? rawPath
            : rawPath.replace(/^public\//, "/");

          setActiveEbookUrl(cleanPath);
          return;
        } else {
          toast.error(
            "This book is only available in physical format and does not have a digital e-book version.",
          );
          return;
        }
      }

      // Route Variant B: Physical book match -> Fetch deep relations asynchronously using your dynamic GET API
      try {
        const loadToast = toast.loading("Checking inventory statuses...");
        const response = await fetch(`/api/books/${book.id}`);
        const json = await response.json();
        toast.dismiss(loadToast);

        if (!response.ok || !json.success) {
          throw new Error(json.error || "Failed to load copy structures.");
        }

        // Synchronize backend details object with local overlay view layer
        setSelectedPhysicalBook(json.data);
        setIsPhysicalModalOpen(true);
      } catch (err: any) {
        console.error("Fetch inventory error:", err);
        toast.error(
          err.message || "Could not retrieve current book availability.",
        );
      }
    },
    [activeTab],
  );

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
            books={filteredBooks}
            onViewChange={setViewMode}
            viewMode={viewMode}
            onBookClick={handleBookClick}
          />
        );

      case "Physical":
        return (
          <PhysicalTab
            books={filteredBooks}
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

      {/*  CONDITIONAL IN-APP MODAL RENDER PORTAL LAYOUT */}
      {activeEbookUrl && (
        <EbookReaderContainer
          fileUrl={activeEbookUrl}
          onClose={() => setActiveEbookUrl(null)} // Unmounting handles cleanup/garbage collection automatically
        />
      )}

      {/* CONDITIONAL PHYSICAL COPIES TRACKING AND RESERVATIONS OVERLAY */}
      <PhysicalBookDetailsModal
        book={selectedPhysicalBook}
        isOpen={isPhysicalModalOpen}
        isReserving={isReserving}
        onClose={() => {
          setIsPhysicalModalOpen(false);
          setSelectedPhysicalBook(null);
        }}
        onReserve={handleReserveBook}
      />
    </div>
  );
}
