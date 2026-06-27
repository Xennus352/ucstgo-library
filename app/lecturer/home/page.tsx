"use client";

import React, { useEffect, useState } from "react";
import { LibraryHome } from "@/components/students/tabs/HomeTab";
import {
  getLibraryDashboardMetrics,
  LibraryMetrics,
} from "@/app/actions/libraryStats";
import { getLatestBooks } from "@/app/actions/library";
import { toast } from "sonner";

// Match the structural interface used by the layout view
interface Book {
  title: string;
  author: string;
  year: string;
  imageUrl?: string;
}

const LecturerHome = () => {
  const [statsData, setStatsData] = useState<LibraryMetrics>({
    totalBooks: 0,
    students: 0,
    totalCategories: 0,
    totalAuthors: 0,
  });
  const [latestBooks, setLatestBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Fetch both metrics and latest arrivals concurrently
        const [metricsRes, booksRes] = await Promise.all([
          getLibraryDashboardMetrics(),
          getLatestBooks(),
        ]);

        if (metricsRes.success && metricsRes.data) {
          setStatsData(metricsRes.data);
        } else {
          toast.error(
            metricsRes.error || "Failed loading live counter configurations",
          );
        }

        if (booksRes.success && booksRes.books) {
          setLatestBooks(booksRes.books);
        } else {
          toast.error(
            booksRes.error || "Failed loading latest arrivals from database",
          );
        }
      } catch (err) {
        toast.error("Network interface error updating statistics profiles");
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground animate-pulse font-medium">
        📊 Harmonizing campus metrics catalog summaries...
      </div>
    );
  }

  return (
    <div>
      <LibraryHome initialCounts={statsData} initialLatestBooks={latestBooks} />
    </div>
  );
};

export default LecturerHome;
