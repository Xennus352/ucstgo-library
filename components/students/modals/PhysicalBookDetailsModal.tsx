"use client";

import React from "react";
import {
  Book as BookIcon,
  MapPin,
  Layers,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
} from "lucide-react";
import { BookWithDetails } from "@/components/students/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PhysicalBookDetailsModalProps {
  book: BookWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onReserve: (bookId: string) => void;
  onBorrow: (bookId: string) => void; // Add borrow handler
  isBorrowing?: boolean;
  isReserving?: boolean;
}

export const PhysicalBookDetailsModal: React.FC<
  PhysicalBookDetailsModalProps
> = ({
  book,
  isOpen,
  onClose,
  onReserve,
  onBorrow, // Receive borrow handler
  isBorrowing = false,
  isReserving = false,
}) => {
  if (!book) return null;

  const copies = book.copies || [];

  // Calculate availability stats based on your CopyStatus
  const totalCopies = copies.length;
  const availableCopies = copies.filter((c) => c.status === "AVAILABLE").length;
  const borrowedCopies = copies.filter((c) => c.status === "BORROWED").length;
  const isAvailable = availableCopies > 0;

  // Extract unique locations from your string | null values
  const uniqueLocations = Array.from(
    new Set(
      copies.map((c) => c.shelfLocation).filter((loc): loc is string => !!loc),
    ),
  );

  const locationDisplay =
    uniqueLocations.length > 0
      ? uniqueLocations.join(", ")
      : "Main Library Stacks";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-106.25 rounded-2xl p-6 border-border/60 bg-background shadow-lg">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base font-bold tracking-tight">
            Physical Item Details
          </DialogTitle>
        </DialogHeader>

        {/* Book Info Summary */}
        <div className="flex gap-4 items-start mt-2">
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-20 h-28 object-cover rounded-xl border border-border/40 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-20 h-28 bg-muted/60 border border-border/40 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <BookIcon className="h-7 w-7 text-muted-foreground/40" />
            </div>
          )}

          <div className="min-w-0 space-y-1">
            <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-2">
              {book.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              by {book.author?.name || "Unknown Author"}
            </p>
            <p className="text-[10px] text-muted-foreground/70 font-mono tracking-wider">
              ISBN: {book.isbn}
            </p>

            <div className="pt-2">
              {isAvailable ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" /> Available to Borrow
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
                  <XCircle className="h-3 w-3" /> All Copies Out
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Inventory breakdown */}
        <div className="mt-5 space-y-3 p-3.5 bg-muted/40 border border-border/40 rounded-xl text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2 font-medium">
              <Layers className="h-3.5 w-3.5 text-muted-foreground/60" /> Total
              Copies In System
            </span>
            <span className="font-semibold text-foreground">{totalCopies}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-2 font-medium">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />{" "}
              Available Right Now
            </span>
            <span
              className={`font-bold ${isAvailable ? "text-emerald-600" : "text-destructive"}`}
            >
              {availableCopies} left ({borrowedCopies} checked out)
            </span>
          </div>

          <div className="border-t border-border/40 my-1 pt-2 flex justify-between items-start gap-4">
            <span className="text-muted-foreground flex items-center gap-2 font-medium shrink-0">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" /> Shelf
              Location
            </span>
            <span className="font-medium text-foreground text-right line-clamp-2">
              {locationDisplay}
            </span>
          </div>
        </div>

        {/* Action Controls - Updated with Borrow button */}
        <div className="mt-6 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 h-9.5 text-xs font-medium border border-border/80 hover:bg-muted/50 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {/* Borrow Button - Primary Action */}
          <button
            disabled={!isAvailable || isBorrowing || isReserving}
            onClick={() => onBorrow(book.id)}
            className="flex-1 h-9.5 text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isBorrowing ? (
              <>
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Borrowing...
              </>
            ) : (
              <>
                <BookOpen className="h-3.5 w-3.5" />
                Borrow Now
              </>
            )}
          </button>

          {/* Reserve Button - Secondary Action */}
          <button
            disabled={isAvailable || isReserving || isBorrowing}
            onClick={() => onReserve(book.id)}
            className="flex-1 h-9.5 text-xs font-medium bg-primary text-primary-foreground hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center"
          >
            {isReserving ? "Processing..." : "Reserve"}
          </button>
        </div>

        {/* Helpful note when no copies available */}
        {!isAvailable && (
          <p className="text-[10px] text-muted-foreground/70 text-center mt-1">
            All copies are currently checked out. You can place a reservation to
            be notified when a copy becomes available.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
