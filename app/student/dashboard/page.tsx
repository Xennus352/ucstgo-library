"use client";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { BookOpen, Tablet, Book, User } from "lucide-react";

import {
  BookWithDetails,
  TabConfig,
  TabId,
  ViewMode,
} from "@/components/students/types";

import { EbooksTab } from "@/components/students/tabs/EbooksTab";
import { PhysicalTab } from "@/components/students/tabs/PhysicalTab";
import { ProfileTab } from "@/components/students/tabs/ProfileTab";

import { TopNav } from "@/components/students/layout/TopNav";
import BottomNav from "@/components/students/layout/BottomNav";

import { useBooksInfinite } from "@/hooks/useBooksInfinite";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import dynamic from "next/dynamic";

import { PhysicalBookDetailsModal } from "@/components/students/modals/PhysicalBookDetailsModal";

import { borrowBookAction } from "@/app/actions/borrow";
import { fetchEbookOfflineSafe } from "@/lib/ebookCache";
import { getUserProfileData } from "@/app/actions/profile";
import { LibraryHome } from "@/components/students/tabs/HomeTab";

import {
  getLibraryDashboardMetrics,
  LibraryMetrics,
} from "@/app/actions/libraryStats";
import { getLatestBooks } from "@/app/actions/library";
import LoginDialog from "@/components/LoginDialog";
import { getLibrarySettings, LibrarySettings } from "@/app/actions/settings"; // 👈 Added LibrarySettings type import

const EbookReaderContainer = dynamic(
  () => import("@/components/reader/EbookReaderContainer"),
  { ssr: false },
);

const tabsConfig = [
  { id: "Home", label: "Home", icon: BookOpen },
  { id: "eBooks", label: "Ebooks", icon: Tablet },
  { id: "Physical", label: "Books", icon: Book },
  { id: "Profile", label: "Profile", icon: User },
] as const satisfies TabConfig[];

export default function LibraryApp() {
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const isLoggedIn = !!user;

  const [activeTab, setActiveTab] = useState<TabId>("Home");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [activeEbookUrl, setActiveEbookUrl] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [selectedPhysicalBook, setSelectedPhysicalBook] =
    useState<BookWithDetails | null>(null);
  const [isPhysicalModalOpen, setIsPhysicalModalOpen] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [isBorrowing, setIsBorrowing] = useState(false);

  // 1. ⚙️ Define a client state to store your system configuration settings safely
  const [dynamicSettings, setDynamicSettings] = useState<
    LibrarySettings | undefined
  >(undefined);

  const [homeMetrics, setHomeMetrics] = useState<LibraryMetrics | undefined>(
    undefined,
  );
  const [latestBooks, setLatestBooks] = useState<any[]>([]);

  const [profileData, setProfileData] = useState<{
    borrowRecords: any[];
    reservations: any[];
  }>({
    borrowRecords: [],
    reservations: [],
  });
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const visibleTabs = useMemo(() => {
    if (!isLoggedIn) {
      return tabsConfig.filter((tab) => tab.id !== "Profile");
    }
    return tabsConfig;
  }, [isLoggedIn]);

  const loadProfileDetails = useCallback(async () => {
    if (!isLoggedIn) return;
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
  }, [isLoggedIn]);

  const loadHomeDashboardData = useCallback(async () => {
    try {
      // 2. ⚡ Added getLibrarySettings here inside your parallel async thread handler
      const [metricsRes, booksRes, settingsRes] = await Promise.all([
        getLibraryDashboardMetrics(),
        getLatestBooks(),
        getLibrarySettings(),
      ]);

      if (metricsRes.success && metricsRes.data) {
        setHomeMetrics(metricsRes.data);
      }
      if (booksRes.success && booksRes.books) {
        setLatestBooks(booksRes.books);
      }
      // Store settings data to trigger layout updates seamlessly
      if (settingsRes) {
        setDynamicSettings(settingsRes);
      }
    } catch (err) {
      console.error("Failed downloading landing page records:", err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "Profile") {
      loadProfileDetails();
    }
  }, [activeTab, loadProfileDetails]);

  useEffect(() => {
    if (isLoggedIn) {
      loadProfileDetails();
    }
    loadHomeDashboardData();
  }, [loadProfileDetails, loadHomeDashboardData, isLoggedIn]);

  useEffect(() => {
    if (!isUserLoading && !isLoggedIn && activeTab === "Profile") {
      setActiveTab("Home");
    }
  }, [isLoggedIn, isUserLoading, activeTab]);

  const apiType = useMemo(() => {
    if (activeTab === "eBooks") return "ebook";
    if (activeTab === "Physical") return "physical";
    return "all";
  }, [activeTab]);

  const {
    books: liveBooks,
    isLoading: isBooksLoading,
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

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || isBooksLoading) return;

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
  }, [setSize, hasMore, isBooksLoading]);

  const handleTabChange = useCallback(
    (tabId: TabId) => {
      if (!isLoggedIn && tabId !== "Home") {
        setIsAuthModalOpen(true);
        return;
      }
      setActiveTab(tabId);
    },
    [isLoggedIn],
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleReserveBook = async (bookId: string) => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
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
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Unexpected error");
    } finally {
      setIsReserving(false);
    }
  };

  const handleBorrowBook = async (bookId: string) => {
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    const hasAlreadyBorrowed = profileData.borrowRecords.some(
      (record) =>
        record.bookId === bookId &&
        !record.returnedAt &&
        record.status !== "RETURNED",
    );

    if (hasAlreadyBorrowed) {
      toast.error(
        "You have already checked out this book. Please return it before borrowing another copy.",
      );
      return;
    }

    try {
      setIsBorrowing(true);
      const response = await borrowBookAction(bookId);

      if (!response.success) {
        throw new Error(response.error || "Borrow mutation failed");
      }

      toast.success(response.message || "Book successfully checked out!");
      setIsPhysicalModalOpen(false);
      setSelectedPhysicalBook(null);

      mutate();
      loadProfileDetails();
    } catch (err: any) {
      toast.error(err.message || "Unexpected borrow error");
    } finally {
      setIsBorrowing(false);
    }
  };

  const handleBookClick = useCallback(
    async (book: BookWithDetails) => {
      if (!isLoggedIn) {
        setIsAuthModalOpen(true);
        return;
      }
      const rawPath = book.ebook?.filePath;

      if (rawPath) {
        const cleanPath = rawPath.startsWith("http")
          ? rawPath
          : rawPath.replace(/^storage\//, "/");

        const loadingToastId = toast.loading(
          "Preparing e-book for offline reading...",
        );
        try {
          const offlineBlobUrl = await fetchEbookOfflineSafe(cleanPath);
          setActiveEbookUrl(offlineBlobUrl);
          toast.dismiss(loadingToastId);
        } catch (cacheError) {
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
    },
    [isLoggedIn],
  );

  const renderTabContent = useCallback(() => {
    if (isUserLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse px-4 md:px-12">
          🔒 Verifying identity parameters...
        </div>
      );
    }

    if (isBooksLoading && liveBooks.length === 0 && activeTab !== "Home") {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground animate-pulse px-4 md:px-12">
          📖 Loading library...
        </div>
      );
    }

    if (error && activeTab !== "Home") {
      return (
        <div className="mx-4 md:mx-12 my-6 bg-red-50 text-red-700 p-4 rounded-xl">
          ⚠️ {error.message}
        </div>
      );
    }

    switch (activeTab) {
      case "Home":
        return (
          <LibraryHome
            dynamicSettings={dynamicSettings} // 👈 Correctly distributed here
            initialCounts={homeMetrics}
            initialLatestBooks={latestBooks}
            onNavigate={(route) => {
              if (!isLoggedIn) {
                setIsAuthModalOpen(true);
                return;
              }
              if (route === "borrow-books" || route === "search-catalog") {
                setActiveTab("Physical");
              } else if (route === "e-books") {
                setActiveTab("eBooks");
              } else if (route === "study-rooms") {
                toast.info("Study room reservation feature coming soon!");
              }
            }}
          />
        );

      case "eBooks":
        return (
          <div className="px-4 md:px-12 w-full">
            <EbooksTab
              books={filteredBooks}
              onViewChange={setViewMode}
              viewMode={viewMode}
              onBookClick={handleBookClick}
            />
          </div>
        );

      case "Physical":
        return (
          <div className="px-4 md:px-12 w-full">
            <PhysicalTab
              books={filteredBooks}
              onViewChange={setViewMode}
              viewMode={viewMode}
              onBookClick={handleBookClick}
            />
          </div>
        );

      case "Profile":
        if (isProfileLoading) {
          return (
            <div className="text-center py-20 text-muted-foreground animate-pulse px-4 md:px-12">
              Checking your dashboard logs...
            </div>
          );
        }
        return (
          <div className="px-4 md:px-12 w-full">
            <ProfileTab
              borrowRecords={profileData.borrowRecords}
              reservations={profileData.reservations}
            />
          </div>
        );

      default:
        return null;
    }
  }, [
    activeTab,
    filteredBooks,
    viewMode,
    handleBookClick,
    isBooksLoading,
    error,
    liveBooks,
    isProfileLoading,
    profileData,
    homeMetrics,
    latestBooks,
    isLoggedIn,
    isUserLoading,
    dynamicSettings, // 👈 Added dependency tracking mapping
  ]);

  return (
    <div className="w-full min-h-screen bg-background text-foreground flex flex-col">
      <TopNav
        tabs={visibleTabs as any}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSearch={handleSearch}
        isLoggedIn={isLoggedIn}
        searchValue={searchQuery}
      />

      <main className="flex-1 pt-6 pb-28 md:pb-6 w-full">
        {renderTabContent()}

        {activeTab !== "Home" && activeTab !== "Profile" && hasMore && (
          <div ref={loadMoreRef} className="py-12 text-center">
            {isBooksLoading ? "Loading..." : "Scroll to load more"}
          </div>
        )}
      </main>

      <BottomNav
        tabs={visibleTabs as any}
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

      <LoginDialog
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        showTrigger={false}
      />
    </div>
  );
}
