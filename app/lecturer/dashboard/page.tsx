"use client";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { BookOpen, Tablet, Book, User } from "lucide-react";

import {
  BookWithDetails,
  TabConfig,
  TabId,
  ViewMode,
} from "@/components/students/types";

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

import { borrowBookAction } from "@/app/actions/borrow";
import { fetchEbookOfflineSafe } from "@/lib/ebookCache";
import { getUserProfileData } from "@/app/actions/profile";

const EbookReaderContainer = dynamic(
  () => import("@/components/reader/EbookReaderContainer"),
  { ssr: false },
);


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

  const [activeEbookUrl, setActiveEbookUrl] = useState<string | null>(null);

  const [selectedPhysicalBook, setSelectedPhysicalBook] =
    useState<BookWithDetails | null>(null);
  const [isPhysicalModalOpen, setIsPhysicalModalOpen] = useState(false);
  const [isReserving, setIsReserving] = useState(false);

  // FOR BORROWING
  const [isBorrowing, setIsBorrowing] = useState(false);

  
  const [profileData, setProfileData] = useState<{
    borrowRecords: any[];
    reservations: any[];
  }>({
    borrowRecords: [],
    reservations: [],
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  // 2. Create a handler to fetch profile information dynamically:
  const loadProfileDetails = useCallback(async () => {
    try {
      setIsProfileLoading(true);
      const res = await getUserProfileData();
      if (res.success && res.data) {
        setProfileData(res.data);
      } else {
        toast.error(res.error || "Could not synchronize history items");
      }
    } catch (err) {
      toast.error("Network error sync failure");
    } finally {
      setIsProfileLoading(false);
    }
  }, []);

  // 3. Trigger data download whenever the user selects the profile view segment:
  useEffect(() => {
    if (activeTab === "Profile") {
      loadProfileDetails();
    }
  }, [activeTab, loadProfileDetails]);

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
    mutate,
  } = useBooksInfinite(apiType);

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

  const reservedBooks = useMemo(() => {
    return filteredBooks.filter((b) => {
      const progress = b.readingProgress ?? 0;
      return b.isReserved || (progress > 0 && progress < 100);
    });
  }, [filteredBooks]);

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setSize((s) => s + 1);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [setSize, hasMore, isLoading]);

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

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
        throw new Error(json.error || "Reservation failed");
      }

      toast.success("Reservation successful!");
      setIsPhysicalModalOpen(false);
      setSelectedPhysicalBook(null);

      // Sync client state immediately across SWR book array segments
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Unexpected error");
    } finally {
      setIsReserving(false);
    }
  };

  // IMPLEMENT THE BORROW HANDLER
  const handleBorrowBook = async (bookId: string) => {
    try {
      setIsBorrowing(true);

      // Call the secure backend action
      const response = await borrowBookAction(bookId);

      if (!response.success) {
        throw new Error(response.error || "Borrow mutation failed");
      }

      toast.success(response.message || "Book successfully checked out!");
      setIsPhysicalModalOpen(false);
      setSelectedPhysicalBook(null);

      // Refresh cache dynamically upon checkout completion
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Unexpected borrow error");
    } finally {
      setIsBorrowing(false);
    }
  };

  const handleBookClick = useCallback(async (book: BookWithDetails) => {
    const rawPath = book.ebook?.filePath;

    // E-book execution block containing IndexedDB routing hooks
    if (rawPath) {
      const cleanPath = rawPath.startsWith("http")
        ? rawPath
        : rawPath.replace(/^storage\//, "/");

      const loadingToastId = toast.loading(
        "Preparing e-book for offline reading...",
      );
      try {
        // OPTIMIZATION: Pass paths down directly through your IndexedDB cache layer
        const offlineBlobUrl = await fetchEbookOfflineSafe(cleanPath);
        setActiveEbookUrl(offlineBlobUrl);
        toast.dismiss(loadingToastId);
      } catch (cacheError) {
        // Fallback gracefully to live stream URLs if browser IndexedDB space quotas fail
        toast.dismiss(loadingToastId);
        setActiveEbookUrl(cleanPath);
      }
      return;
    }

    try {
      const loadToast = toast.loading("Checking inventory...");
      const response = await fetch(`/api/books/${book.id}`);
      const json = await response.json();

      toast.dismiss(loadToast);

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Failed to load book");
      }

      setSelectedPhysicalBook(json.data);
      setIsPhysicalModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Error loading book");
    }
  }, []);

  const renderTabContent = useCallback(() => {
    if (isLoading && liveBooks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse">
          📖 Loading library...
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl">
          ⚠️ {error.message}
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
        if (isProfileLoading) {
          return (
            <div className="text-center py-20 text-muted-foreground animate-pulse">
              Checking your dashboard logs...
            </div>
          );
        }
        return (
          <ProfileTab
            borrowRecords={profileData.borrowRecords}
            reservations={profileData.reservations}
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
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col">
      <TopNav
        tabs={tabsConfig as any}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSearch={handleSearch}
        searchValue={searchQuery}
      />

      <main className="flex-1 px-4 md:px-12 pt-6 pb-28 md:pb-6">
        {renderTabContent()}

        {activeTab !== "Profile" && hasMore && (
          <div ref={loadMoreRef} className="py-12 text-center">
            {isLoading ? "Loading..." : "Scroll to load more"}
          </div>
        )}
      </main>

      <BottomNav
        tabs={tabsConfig as any}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {activeEbookUrl && (
        <EbookReaderContainer
          fileUrl={activeEbookUrl}
          onClose={() => setActiveEbookUrl(null)}
        />
      )}

      <PhysicalBookDetailsModal
        book={selectedPhysicalBook}
        isOpen={isPhysicalModalOpen}
        isReserving={isReserving}
        isBorrowing={isBorrowing}
        onClose={() => {
          setIsPhysicalModalOpen(false);
          setSelectedPhysicalBook(null);
        }}
        onReserve={handleReserveBook}
        onBorrow={handleBorrowBook}
      />
    </div>
  );
}