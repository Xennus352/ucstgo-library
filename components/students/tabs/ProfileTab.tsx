"use client";

import React, { useState } from "react";
import {
  User,
  Calendar,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Clock,
  IdCard,
  XCircle,
  Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

import { BorrowRecord } from "../types";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ReservationStatus } from "@/app/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import BookManagementModal from "@/components/lecturer/BookManagementModal";
import { toast } from "sonner";

interface ProfileBorrowRecord extends BorrowRecord {
  copy: {
    id: string;
    barcode: string;
    shelfLocation: string | null;

    book: {
      id: string;
      title: string;
      isbn: string;

      category: {
        id: string;
        name: string;
      };

      author: {
        id: string;
        name: string;
      };
    };
  };
}

interface ProfileReservation {
  id: string;
  reservedAt: Date;
  expiresAt: Date | null;
  status: ReservationStatus;

  book: {
    id: string;
    title: string;
    isbn: string;
    author: {
      id: string;
      name: string;
    };
    category: {
      id: string;
      name: string;
    };
  };
}

interface ProfileTabProps {
  borrowRecords?: ProfileBorrowRecord[];
  reservations?: ProfileReservation[];
  onReservationUpdate?: () => void;
  onCancelReservation?: (reservationId: string) => Promise<boolean>;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  borrowRecords = [],
  reservations = [],
  onReservationUpdate,
  onCancelReservation,
}) => {
  const { user, isLoading, error } = useCurrentUser();
  const [activityTab, setActivityTab] = useState<
    "borrows" | "reservations" | "history"
  >("borrows");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancellingReservationId, setCancellingReservationId] = useState<
    string | null
  >(null);

  // Loading State (Skeleton Feedback)
  if (isLoading) {
    return (
      <div className="w-full mx-auto space-y-6 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-muted/40 border border-border/60 rounded-3xl h-64" />
            <div className="bg-muted/40 border border-border/60 rounded-3xl h-48" />
          </div>
          <div className="lg:col-span-7 h-96 bg-muted/20 border border-dashed border-border/80 rounded-3xl" />
        </div>
      </div>
    );
  }

  //  Error Fallback State
  if (error || !user) {
    return (
      <EmptyLogsPlaceholder
        icon={User}
        title="Failed to Load Profile"
        description="Could not securely fetch your session data. Please try refreshing or logging back in."
      />
    );
  }

  // Handle cancel reservation
  const handleCancelReservation = async (reservationId: string) => {
    if (
      !confirm(
        "Are you sure you want to cancel this reservation? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setCancellingReservationId(reservationId);

      // If onCancelReservation prop is provided, use it
      if (onCancelReservation) {
        const success = await onCancelReservation(reservationId);
        if (success && onReservationUpdate) {
          onReservationUpdate();
        }
        return;
      }

      // Fallback: Direct API call
      const response = await fetch(
        `/api/reservations/${reservationId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel reservation");
      }

      toast.success(data.message || "Reservation cancelled successfully!");

      // Refresh reservations list
      if (onReservationUpdate) {
        onReservationUpdate();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel reservation");
    } finally {
      setCancellingReservationId(null);
    }
  };

  // Check if reservation is expired
  const isReservationExpired = (reservation: ProfileReservation) => {
    if (!reservation.expiresAt) return false;
    return new Date(reservation.expiresAt) < new Date();
  };

  // Categorize activity logs
  const activeBorrows = borrowRecords.filter((b) => b.status === "BORROWED");

  const activeReservations = reservations.filter(
    (r) => r.status === ReservationStatus.ACTIVE,
  );

  const pastBorrows = borrowRecords.filter(
    (b) => b.status === ("RETURNED" as any),
  );

  // Due date book count
  const now = new Date();

  const overdueCount = activeBorrows.filter(
    (b) => b.dueDate && new Date(b.dueDate) < now,
  ).length;

  const dueSoonCount = activeBorrows.filter((b) => {
    if (!b.dueDate) return false;

    const due = new Date(b.dueDate);
    const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    return diffDays >= 0 && diffDays <= 3; // next 3 days
  }).length;

  return (
    <div className="w-full mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* MASTER RESPONSIVE GRID CONFIGURATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/*  LEFT SIDEBAR PANEL */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main User Premium Identity Card */}
          <div className="bg-card border border-border/60 rounded-3xl overflow-hidden shadow-xs relative">
            <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-tr from-sky-500/10 via-cyan-400/5 to-transparent border-b border-border/20" />

            <div className="relative pt-12 pb-6 px-6 flex flex-col items-center text-center">
              {/* Profile Image Frame */}
              <div className="h-24 w-24 rounded-full bg-background border-4 border-card shadow-md flex items-center justify-center overflow-hidden z-10 relative group">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-linear-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white">
                    <User className="h-10 w-10 text-white drop-shadow-sm" />
                  </div>
                )}
              </div>

              {/* Name & ID Badge Header */}
              <h2 className="text-xl font-bold tracking-tight text-foreground mt-4">
                {user.name}
              </h2>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                {/* ID Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground text-xs font-semibold border border-border/30 shadow-2xs backdrop-blur-xs">
                  <IdCard className="h-3.5 w-3.5 text-sky-500" />
                  <span>{user.studentId || "No Assigned ID"}</span>
                </div>

                {/* Role Indicator Accent */}
                {user.role && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/15 shadow-2xs backdrop-blur-xs">
                    {user.role}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Count Numerical Metrics */}
            <div className="grid grid-cols-4 border-t border-border/50 bg-muted/20 text-center divide-x divide-border/40">
              {/* Borrowed */}
              <div className="py-3 px-2">
                <div className="text-lg font-bold text-sky-600">
                  {activeBorrows.length}
                </div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Borrowed
                </div>
              </div>

              {/* Reserved */}
              <div className="py-3 px-2">
                <div className="text-lg font-bold text-emerald-600">
                  {activeReservations.length}
                </div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Reserved
                </div>
              </div>

              {/* Overdue */}
              <div className="py-3 px-2">
                <div className="text-lg font-bold text-red-600">
                  {overdueCount}
                </div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Overdue
                </div>
              </div>

              {/* Due Soon */}
              <div className="py-3 px-2">
                <div className="text-lg font-bold text-amber-600">
                  {dueSoonCount}
                </div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Due Soon
                </div>
              </div>
            </div>
          </div>

          {/* User Specific Data Fields List */}
          <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-muted-foreground/80 uppercase tracking-wider px-1">
              Account Identification Details
            </h4>

            <div className="space-y-3.5">
              {/* Email Entry Line */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 border border-sky-500/5">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-muted-foreground">
                    Email Address
                  </p>
                  <p className="text-xs font-medium text-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Phone Entry Line */}
              {user.phone && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/5">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      Contact Phone
                    </p>
                    <p className="text-xs font-medium text-foreground truncate">
                      {user.phone}
                    </p>
                  </div>
                </div>
              )}

              {/* Faculty Entry Line */}
              {user.faculty && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/5">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      Assigned Faculty
                    </p>
                    <p className="text-xs font-medium text-foreground truncate">
                      {user.faculty}
                    </p>
                  </div>
                </div>
              )}

              {/* Timestamp History Line */}
              {user.createdAt && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/5">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      Library Enrollment
                    </p>
                    <p className="text-xs font-medium text-foreground truncate">
                      {user.createdAt.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}

              {user.role === "LECTURER" && (
                <div className="w-full flex justify-end">
                  <Button
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setIsModalOpen(true)}
                  >
                    Ebook Management
                  </Button>
                </div>
              )}

              {/* multi-tab BookManagementModal */}
              <BookManagementModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)} // Closes the modal
                onSuccess={() => {
                  console.log("Operation completed successfully!");
                }}
              />
            </div>
          </div>
        </div>

        {/* ================= RIGHT MAIN AREA ================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 px-1">
            <div>
              <h3 className="text-sm md:text-base font-bold text-foreground tracking-tight">
                Activity Logs & Timeline
              </h3>
              <p className="text-[11px] md:text-xs text-muted-foreground">
                Track real-time circulation statuses
              </p>
            </div>

            <Tabs
              value={activityTab}
              onValueChange={(value) => setActivityTab(value as any)}
              className="shrink-0"
            >
              <TabsList className="grid grid-cols-3 h-9 w-full sm:w-[280px] p-1 bg-muted/60 rounded-xl border border-border/40 relative select-none">
                <TabsTrigger
                  value="borrows"
                  className="relative flex items-center justify-center text-xs font-medium rounded-lg transition-colors duration-200 data-[state=active]:text-foreground text-muted-foreground z-10 cursor-pointer shadow-none data-[state=active]:bg-transparent"
                >
                  {activityTab === "borrows" && (
                    <motion.div
                      layoutId="profile-activity-pill"
                      className="absolute inset-0 bg-card rounded-lg shadow-xs border border-border/10 -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span>Active</span>
                </TabsTrigger>

                <TabsTrigger
                  value="reservations"
                  className="relative flex items-center justify-center text-xs font-medium rounded-lg transition-colors duration-200 data-[state=active]:text-foreground text-muted-foreground z-10 cursor-pointer shadow-none data-[state=active]:bg-transparent"
                >
                  {activityTab === "reservations" && (
                    <motion.div
                      layoutId="profile-activity-pill"
                      className="absolute inset-0 bg-card rounded-lg shadow-xs border border-border/10 -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span>Holds</span>
                </TabsTrigger>

                <TabsTrigger
                  value="history"
                  className="relative flex items-center justify-center text-xs font-medium rounded-lg transition-colors duration-200 data-[state=active]:text-foreground text-muted-foreground z-10 cursor-pointer shadow-none data-[state=active]:bg-transparent"
                >
                  {activityTab === "history" && (
                    <motion.div
                      layoutId="profile-activity-pill"
                      className="absolute inset-0 bg-card rounded-lg shadow-xs border border-border/10 -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                  <span>History</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activityTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="space-y-2.5 min-h-[260px]"
            >
              {activityTab === "borrows" && (
                <>
                  {activeBorrows.length === 0 ? (
                    <EmptyLogsPlaceholder
                      icon={BookOpen}
                      title="No Active Checkouts"
                      description="You do not have any items checked out right now."
                    />
                  ) : (
                    activeBorrows.map((borrow) => {
                      const isOverdue =
                        borrow.dueDate && new Date(borrow.dueDate) < new Date();

                      return (
                        <div
                          key={borrow.id}
                          className={`group bg-card border rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all
        ${
          isOverdue
            ? "border-red-400/60 hover:border-red-500"
            : "border-border/50 hover:border-sky-400/40"
        }`}
                        >
                          {/* LEFT SIDE */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`p-2.5 rounded-xl border transition-transform group-hover:scale-102
            ${
              isOverdue
                ? "bg-red-500/10 text-red-600 border-red-500/10"
                : "bg-sky-500/10 text-sky-600 border-sky-500/5"
            }`}
                            >
                              <BookOpen className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              {/* TITLE */}
                              <h5 className="text-xs font-bold text-foreground truncate">
                                {borrow.copy?.book?.title || "Unknown Book"}
                              </h5>

                              {/* AUTHOR */}
                              <p className="text-[11px] text-muted-foreground truncate">
                                by{" "}
                                {borrow.copy?.book?.author?.name ||
                                  "Unknown Author"}
                              </p>

                              {/* DUE DATE */}
                              <p
                                className={`text-[11px] mt-0.5 flex items-center gap-1 ${
                                  isOverdue
                                    ? "text-red-500 font-semibold"
                                    : "text-muted-foreground"
                                }`}
                              >
                                <Clock className="h-3 w-3" />
                                Due:{" "}
                                {borrow.dueDate
                                  ? new Date(borrow.dueDate).toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      },
                                    )
                                  : "No due date"}
                              </p>

                              {/* COPY ID */}
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                Copy ID: {borrow.copyId}
                              </p>
                            </div>
                          </div>

                          {/* RIGHT SIDE STATUS */}
                          <span
                            className={`text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full border shrink-0
          ${
            isOverdue
              ? "bg-red-500/10 text-red-600 border-red-500/20"
              : "bg-sky-500/10 text-sky-600 border-sky-500/10"
          }`}
                          >
                            {isOverdue ? "Overdue" : "Checked Out"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {activityTab === "reservations" && (
                <>
                  {activeReservations.length === 0 ? (
                    <EmptyLogsPlaceholder
                      icon={Clock}
                      title="No Active Reservations"
                      description="There are no books currently held in your queue."
                    />
                  ) : (
                    activeReservations.map((res) => {
                      const isExpired = isReservationExpired(res);
                      return (
                        <div
                          key={res.id}
                          className={`group bg-card border rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all ${
                            isExpired
                              ? "border-red-400/60 hover:border-red-500"
                              : "border-border/50 hover:border-emerald-400/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`p-2.5 rounded-xl border ${
                                isExpired
                                  ? "bg-red-500/10 text-red-600 border-red-500/10"
                                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/5"
                              }`}
                            >
                              <BookOpen className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h5 className="text-xs font-bold text-foreground truncate">
                                {res.book.title}
                              </h5>

                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {res.book.author.name} •{" "}
                                {res.book.category?.name}
                              </p>

                              <div className="flex items-center gap-3 mt-1">
                                <p className="text-[11px] text-muted-foreground">
                                  Reserved on{" "}
                                  {new Date(res.reservedAt).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </p>
                                {res.expiresAt && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                    <p
                                      className={`text-[11px] ${
                                        isExpired
                                          ? "text-red-500 font-semibold"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      Expires{" "}
                                      {new Date(
                                        res.expiresAt,
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Status Badge */}
                            <span
                              className={`text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${
                                isExpired
                                  ? "bg-red-500/10 text-red-600 border-red-500/20"
                                  : "bg-emerald-500/10 text-emerald-600 border-emerald-500/10"
                              }`}
                            >
                              {isExpired ? "Expired" : "On Hold"}
                            </span>

                            {/* Cancel Button - Only show if not expired */}
                            {!isExpired && (
                              <button
                                onClick={() => handleCancelReservation(res.id)}
                                disabled={cancellingReservationId === res.id}
                                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                                title="Cancel reservation"
                              >
                                {cancellingReservationId === res.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {activityTab === "history" && (
                <>
                  {pastBorrows.length === 0 ? (
                    <EmptyLogsPlaceholder
                      icon={IdCard}
                      title="No Historical Records"
                      description="No catalog return logs were found linked to this student account."
                    />
                  ) : (
                    pastBorrows.map((log) => (
                      <div
                        key={log.id}
                        className="group relative bg-gradient-to-br from-white to-gray-50/80 dark:from-gray-800/90 dark:to-gray-900/80 border border-gray-200/60 dark:border-gray-700/60 rounded-2xl p-5 hover:shadow-xl hover:border-gray-300/80 dark:hover:border-gray-600/80 transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
                      >
                        {/* Status Indicator Bar - Left side accent */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700 rounded-r-full opacity-80 group-hover:opacity-100 transition-opacity" />

                        {/* Card Content */}
                        <div className="flex items-center justify-between gap-4 pl-3">
                          {/* Left Section - Book Info */}
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            {/* Book Icon with gradient background */}
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 dark:from-emerald-500/30 dark:to-teal-500/30 flex items-center justify-center border border-emerald-200/40 dark:border-emerald-700/40 group-hover:scale-105 group-hover:border-emerald-300/60 dark:group-hover:border-emerald-600/60 transition-all duration-300 shadow-sm group-hover:shadow-md">
                                <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              {/* Small status dot */}
                              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm animate-pulse" />
                            </div>

                            {/* Book Details */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <h5 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                  {log.copy.book.title}
                                </h5>
                                {/* Category Badge */}
                                {log.copy.book.category && (
                                  <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50">
                                    {log.copy.book.category.name}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                  <span className="text-gray-400 dark:text-gray-500">
                                    by
                                  </span>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {log.copy.book.author.name}
                                  </span>
                                </p>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                <p className="text-[10px] font-mono text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                  <span className="text-gray-400 dark:text-gray-500">
                                    📚
                                  </span>
                                  {log.copy.barcode}
                                </p>
                              </div>

                              {/* Return Date with icon */}
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <svg
                                  className="w-3 h-3 text-emerald-500 dark:text-emerald-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                  Returned on{" "}
                                  {log.returnDate
                                    ? new Date(
                                        log.returnDate,
                                      ).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })
                                    : "Unknown"}
                                </p>
                                {/* Duration badge */}
                                {log.borrowDate && log.returnDate && (
                                  <span className="text-[9px] text-gray-400 dark:text-gray-500 ml-1 bg-gray-100 dark:bg-gray-700/50 px-1.5 py-0.5 rounded-full">
                                    {Math.ceil(
                                      (new Date(log.returnDate).getTime() -
                                        new Date(log.borrowDate).getTime()) /
                                        (1000 * 60 * 60 * 24),
                                    )}{" "}
                                    days
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Section - Status & Actions */}
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Status Badge - Enhanced */}
                            <div className="flex flex-col items-end gap-1">
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide px-3 py-1 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-800/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/50 shadow-sm">
                                <svg
                                  className="w-2.5 h-2.5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Returned
                              </span>
                              {/* Completion time */}
                              {log.returnDate && (
                                <span className="text-[9px] text-gray-400 dark:text-gray-500">
                                  {new Date(log.returnDate).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Subtle bottom gradient line */}
                        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gray-200/50 dark:via-gray-700/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Area */}
      <div className="mt-12 pt-4 border-t border-border/20 text-center text-[11px] text-muted-foreground/50 flex flex-row items-center justify-center gap-4">
        <a
          href="#terms"
          className="hover:text-foreground transition-colors hover:underline"
        >
          Terms of Service
        </a>
        <span className="h-2.5 w-px bg-border/40" />
        <a
          href="#privacy"
          className="hover:text-foreground transition-colors hover:underline"
        >
          Privacy Framework
        </a>
      </div>
    </div>
  );
};

interface PlaceholderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}
const EmptyLogsPlaceholder: React.FC<PlaceholderProps> = ({
  icon: Icon,
  title,
  description,
}) => (
  <div className="w-full flex flex-col items-center justify-center text-center p-8 bg-muted/20 border border-dashed border-border/80 rounded-3xl min-h-[220px]">
    <div className="p-3 bg-card rounded-2xl border border-border/30 text-muted-foreground shadow-2xs mb-3">
      <Icon className="h-5 w-5" />
    </div>
    <h4 className="text-xs font-bold text-foreground tracking-tight">
      {title}
    </h4>
    <p className="text-[11px] text-muted-foreground max-w-xs mt-1 leading-relaxed">
      {description}
    </p>
  </div>
);
