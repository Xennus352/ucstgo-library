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
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

import { BorrowRecord, Reservation } from "../types";
import { useCurrentUser } from "@/hooks/use-current-user";

interface ProfileTabProps {
  borrowRecords?: BorrowRecord[];
  reservations?: Reservation[];
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  borrowRecords = [],
  reservations = [],
}) => {
  const { user, isLoading, error } = useCurrentUser();
  const [activityTab, setActivityTab] = useState<
    "borrows" | "reservations" | "history"
  >("borrows");

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

  // Categorize activity logs
  const activeBorrows = borrowRecords.filter(
    (b) => b.status === ("ACTIVE" as any),
  );
  const activeReservations = reservations.filter(
    (r) => r.status === ("ACTIVE" as any),
  );
  const pastBorrows = borrowRecords.filter(
    (b) => b.status === ("RETURNED" as any),
  );

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
            <div className="grid grid-cols-3 border-t border-border/50 bg-muted/20 text-center divide-x divide-border/40">
              <div className="py-3 px-2">
                <div className="text-lg font-bold text-sky-600">
                  {activeBorrows.length}
                </div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Borrowed
                </div>
              </div>
              <div className="py-3 px-2">
                <div className="text-lg font-bold text-emerald-600">
                  {activeReservations.length}
                </div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Reserved
                </div>
              </div>
              <div className="py-3 px-2">
                <div className="text-lg font-bold text-slate-600">
                  {borrowRecords.length}
                </div>
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  Total Logs
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
                    activeBorrows.map((borrow) => (
                      <div
                        key={borrow.id}
                        className="group bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all hover:border-sky-400/40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 border border-sky-500/5 group-hover:scale-102 transition-transform">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-foreground truncate">
                              Asset Identifier #{borrow.copyId}
                            </h5>
                            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-sky-500" /> Due:{" "}
                              {new Date(borrow.dueDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 border border-sky-500/10 shrink-0">
                          Checked Out
                        </span>
                      </div>
                    ))
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
                    activeReservations.map((res) => (
                      <div
                        key={res.id}
                        className="group bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-xs transition-all hover:border-emerald-400/40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/5 group-hover:scale-102 transition-transform">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-foreground truncate">
                              Reserved Book Reference
                            </h5>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Expires on pickup hold date limits
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/10 shrink-0">
                          On Hold
                        </span>
                      </div>
                    ))
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
                        className="bg-card/70 border border-border/40 rounded-2xl p-4 flex items-center justify-between shadow-xs opacity-85"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 rounded-xl bg-muted text-muted-foreground border border-border/20">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-muted-foreground line-through truncate">
                              Asset Unique #{log.copyId}
                            </h5>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Completed circulation process
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50 shrink-0">
                          Returned
                        </span>
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
