"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { isToday, isThisWeek, isThisMonth } from "date-fns";
import { ReservationStats } from "@/components/reservations/ReservationStats";
import { ReservationFilters } from "@/components/reservations/ReservationFilters";
import { ReservationTable } from "@/components/reservations/ReservationTable";
import { Pagination } from "@/components/reservations/Pagination";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Reservation {
  id: string;
  status: "ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED";
  reservedAt: string;
  expiresAt: string;
  user: { id: string; name: string; email: string; studentId?: string };
  book: { id: string; title: string; isbn: string; author: { name: string } };
}

export default function ReservationPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<
    Reservation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    fulfilled: 0,
    cancelled: 0,
    expired: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Custom Confirmation Dialog State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    variant: "default" | "destructive";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    actionLabel: "Continue",
    variant: "default",
    onConfirm: () => {},
  });

  // Fetch all records exactly once on component mounting
  useEffect(() => {
    fetchReservations();
  }, []);

  // Compute all filtering logic locally
  useEffect(() => {
    let result = [...reservations];

    if (statusFilter !== "ALL") {
      result = result.filter((r) => r?.status === statusFilter);
    }

    if (dateFilter !== "ALL") {
      result = result.filter((r) => {
        if (!r?.reservedAt) return false;
        const date = new Date(r.reservedAt);
        if (isNaN(date.getTime())) return false;

        if (dateFilter === "TODAY") return isToday(date);
        if (dateFilter === "WEEK") return isThisWeek(date, { weekStartsOn: 1 });
        if (dateFilter === "MONTH") return isThisMonth(date);
        return true;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((r) => {
        const userName = r?.user?.name?.toLowerCase() || "";
        const userEmail = r?.user?.email?.toLowerCase() || "";
        const bookTitle = r?.book?.title?.toLowerCase() || "";
        const bookIsbn = r?.book?.isbn || "";

        return (
          userName.includes(query) ||
          userEmail.includes(query) ||
          bookTitle.includes(query) ||
          bookIsbn.includes(query)
        );
      });
    }

    setFilteredReservations(result);
    setCurrentPage(1);
  }, [reservations, searchQuery, statusFilter, dateFilter]);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reservations`);
      const data = await response.json();

      if (data.success) {
        setReservations(data.data || []);
        calculateStats(data.data || []);
      } else {
        toast.error(data.error || "Failed to load reservations");
      }
    } catch {
      toast.error("Failed to load reservations");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data: Reservation[]) => {
    setStats({
      total: data.length,
      active: data.filter((r) => r?.status === "ACTIVE").length,
      fulfilled: data.filter((r) => r?.status === "FULFILLED").length,
      cancelled: data.filter((r) => r?.status === "CANCELLED").length,
      expired: data.filter((r) => r?.status === "EXPIRED").length,
    });
  };

  // Execution functions separated from confirmation prompts
  const executeFulfill = async (reservationId: string) => {
    try {
      setIsProcessing(reservationId);
      const response = await fetch(
        `/api/reservations/${reservationId}/fullfill`,
        { method: "POST" },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Reservation fulfilled successfully!");
        fetchReservations();
      } else {
        toast.error(data.error || "Failed to fulfill reservation");
      }
    } catch {
      toast.error("Failed to fulfill reservation");
    } finally {
      setIsProcessing(null);
    }
  };

  const executeCancel = async (reservationId: string) => {
    try {
      setIsProcessing(reservationId);
      const response = await fetch(
        `/api/reservations/${reservationId}/cancel`,
        { method: "POST" },
      );
      const data = await response.json();
      if (data.success) {
        toast.success("Reservation cancelled successfully");
        fetchReservations();
      } else {
        toast.error(data.error || "Failed to cancel reservation");
      }
    } catch {
      toast.error("Failed to cancel reservation");
    } finally {
      setIsProcessing(null);
    }
  };

  // Triggers for custom confirmation modal
  const handleFulfillReservation = (reservationId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Fulfill Reservation?",
      description:
        "Are you sure you want to fulfill this reservation? This will create a borrow record.",
      actionLabel: "Fulfill",
      variant: "default",
      onConfirm: () => executeFulfill(reservationId),
    });
  };

  const handleCancelReservation = (reservationId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Cancel Reservation?",
      description:
        "Are you sure you want to cancel this reservation? This action cannot be undone.",
      actionLabel: "Cancel Reservation",
      variant: "destructive",
      onConfirm: () => executeCancel(reservationId),
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReservations.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-sm p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <ReservationStats stats={stats} />

      <ReservationFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        onRefresh={fetchReservations}
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ReservationTable
          items={currentItems}
          isProcessing={isProcessing}
          onFulfill={handleFulfillReservation}
          onCancel={handleCancelReservation}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          indexOfFirstItem={indexOfFirstItem}
          indexOfLastItem={indexOfLastItem}
          totalItems={filteredReservations.length}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {/* Reusable Shadcn UI AlertDialog Wrapper */}
      <AlertDialog
        open={confirmConfig.isOpen}
        onOpenChange={(open) =>
          setConfirmConfig((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmConfig.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmConfig.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmConfig.onConfirm}
              className={
                confirmConfig.variant === "destructive"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {confirmConfig.actionLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
