"use client";
import React from "react";
import { CheckCircle, MapPin, Star, Heart, Gift } from "lucide-react";
import { BookCopy, BookWithDetails } from "../types";
import { CopyStatus } from "@/app/generated/prisma/enums";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface BookCardProps {
  book: BookWithDetails & { donate?: string | null };
  onClick?: (book: BookWithDetails) => void;
  variant?: "grid" | "list" | "carousel";
  showProgress?: boolean;
  showLocation?: boolean;
  showRating?: boolean;
  showAvailability?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onClick,
  variant = "grid",
  showProgress = false,
  showLocation = false,
  showRating = false,
  showAvailability = false,
}) => {
  const handleClick = () => onClick?.(book);

  const defaultCover = "/images/bookCover.jpg";
  const hasRealCover = !!book.coverImage && book.coverImage.trim() !== "";
  const finalCoverUrl = (hasRealCover ? book.coverImage : defaultCover) || "";

  const availableCopies =
    book.copies?.filter(
      (copy: BookCopy) => copy.status === CopyStatus.AVAILABLE,
    ) || [];

  const isAvailable = availableCopies.length > 0;
  const totalCopies = book.copies?.length || 0;
  const isDonated = !!book.donate && book.donate.trim() !== "";

  const getCoverColor = () => {
    const colors = [
      "bg-amber-100 border-amber-300 text-amber-800",
      "bg-blue-100 border-blue-300 text-blue-800",
      "bg-emerald-100 border-emerald-300 text-emerald-800",
      "bg-purple-100 border-purple-300 text-purple-800",
      "bg-rose-100 border-rose-300 text-rose-800",
      "bg-cyan-100 border-cyan-300 text-cyan-800",
      "bg-indigo-100 border-indigo-300 text-indigo-800",
      "bg-orange-100 border-orange-300 text-orange-800",
    ];
    const index = book.id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const coverColor = getCoverColor();

  if (variant === "carousel") {
    return (
      <div
        onClick={handleClick}
        className="shrink-0 w-28 snap-start flex flex-col group cursor-pointer"
      >
        <div
          className={`h-36 w-full rounded-r-md rounded-l-xs shadow-md border-y border-r ${coverColor} p-2 flex flex-col justify-between transform transition-transform group-hover:-translate-y-1 relative overflow-hidden`}
        >
          <Image
            src={finalCoverUrl}
            alt={book.title}
            fill
            sizes="112px"
            className="object-cover z-0"
            priority={false}
          />
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50 z-10" />

          <div className="relative z-20 flex flex-col h-full justify-between text-white">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/10 rounded-l-xs" />
            <div className="flex justify-between items-center w-full">
              <span className="text-[10px] uppercase tracking-wider opacity-90 font-bold block truncate">
                <Badge variant="secondary" className="text-[8px] px-1 py-0">
                  {book.ebook ? "Ebook" : "Physical"}
                </Badge>
              </span>
              {isDonated && (
                <Heart className="h-3 w-3 text-rose-400 fill-rose-400 shrink-0" />
              )}
            </div>
            <p className="font-serif font-bold text-xs leading-tight line-clamp-3 my-auto drop-shadow-sm">
              {book.title}
            </p>
            <p className="text-[9px] truncate opacity-90 text-right font-medium drop-shadow-sm">
              {book.author?.name || "Unknown Author"}
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold mt-2 text-navy line-clamp-1 group-hover:text-royal">
          {book.title}
        </span>
        <span className="text-[11px] text-muted-foreground line-clamp-1">
          {book.author?.name || "Unknown Author"}
        </span>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div
        onClick={handleClick}
        className="bg-card border border-border/40 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group w-full"
      >
        <div
          className={`w-16 h-20 rounded-lg ${coverColor} flex items-center justify-center border border-border/50 shrink-0 relative overflow-hidden`}
        >
          <Image
            src={finalCoverUrl}
            alt={book.title}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold text-navy group-hover:text-royal truncate">
                  {book.title}
                </p>
                {isDonated && (
                  <span className="inline-flex items-center gap-0.5 text-[9px] font-medium bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 px-1.5 py-0.5 rounded">
                    <Heart className="h-2.5 w-2.5 fill-current" />
                    Donated by {book.donate}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {book.author?.name || "Unknown Author"}
              </p>
              {book.publisher && (
                <p className="text-[10px] text-muted-foreground">
                  {book.publisher} • {book.publicationYear || "N/A"}
                </p>
              )}
            </div>
            {showAvailability && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ml-2 shrink-0 ${
                  isAvailable
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isAvailable
                  ? `${availableCopies.length} Available`
                  : "Unavailable"}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground">
              {book.ebook ? "Ebook" : "Physical"}
            </span>
            {showLocation && book.copies && book.copies.length > 0 && (
              <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {book.copies[0].shelfLocation || "No location"}
              </span>
            )}
            {showRating && book.category && (
              <span className="text-[10px] flex items-center gap-0.5 text-muted-foreground">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {book.category.name}
              </span>
            )}
            {showProgress && book.readingProgress !== undefined && (
              <span className="text-[10px] text-muted-foreground">
                {book.readingProgress}% read
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid variant (default) - Improved design
  return (
    <div
      onClick={handleClick}
      className="group relative bg-card border border-border/40 rounded-xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer w-full aspect-[3/4] max-w-[240px] mx-auto flex flex-col"
    >
      <div
        className={`w-full h-full ${coverColor} relative overflow-hidden flex-1`}
      >
        <div className="absolute inset-2.5 rounded-lg overflow-hidden">
          <Image
            src={finalCoverUrl}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority={true}
          />
        </div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 z-10 flex justify-between items-start">
          <div className="flex flex-col gap-1.5 items-start">
            {showAvailability && (
              <Badge
                variant={isAvailable ? "secondary" : "destructive"}
                className={`text-[9px] px-2 py-0.5 uppercase tracking-widest font-semibold shadow-sm`}
              >
                {isAvailable ? "Available" : "Unavailable"}
              </Badge>
            )}
            {isDonated && (
              <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white border-0 text-[9px] px-2 py-0.5 shadow-sm flex items-center gap-1">
                <Gift className="h-2.5 w-2.5" />
                Donated
              </Badge>
            )}
          </div>
          <Badge
            variant="outline"
            className="bg-black/50 backdrop-blur-sm text-white border-white/20 text-[8px] px-1.5 py-0.5 uppercase tracking-widest font-bold shadow-sm"
          >
            {book.ebook ? "Ebook" : "Physical"}
          </Badge>
        </div>

        {/* Reading Progress */}
        {book.readingProgress !== undefined &&
          book.readingProgress > 0 &&
          book.readingProgress < 100 && (
            <div className="absolute bottom-3 left-3 right-3 z-10 transition-opacity duration-200 group-hover:opacity-0">
              <div className="w-full h-1 bg-muted/60 rounded-full overflow-hidden backdrop-blur-sm">
                <div
                  className="h-full bg-gradient-to-r from-royal to-blue-400 rounded-full transition-all duration-500"
                  style={{ width: `${book.readingProgress}%` }}
                />
              </div>
            </div>
          )}
        {book.readingProgress === 100 && (
          <div className="absolute top-3 right-3 z-10">
            <CheckCircle className="h-4 w-4 text-green-500 bg-white rounded-full shadow-sm" />
          </div>
        )}

        {/* Sliding Details Panel - Redesigned */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/80 to-black/50
           text-white p-5 flex flex-col justify-end
           translate-y-full group-hover:translate-y-0
           transition-all duration-300 ease-out z-20
           backdrop-blur-md"
        >
          <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
            {/* Book Title */}
            <h3 className="text-sm font-bold leading-tight line-clamp-2 mb-1">
              {book.title}
            </h3>

            {/* Author */}
            <p className="text-xs text-white line-clamp-1 mb-1.5">
              by {book.author?.name || "Unknown Author"}
            </p>

            {/* Category & Year */}
            <div className="flex items-center gap-2 mb-2.5">
              {book.category && (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-white/90 border border-white/10">
                  {book.category.name}
                </span>
              )}
              {book.publicationYear && (
                <span className="text-[9px] text-white">
                  {book.publicationYear}
                </span>
              )}
              {book.language && (
                <span className="text-[9px] text-white">• {book.language}</span>
              )}
            </div>

            {/* Divider */}
            <div className="w-12 h-0.5 bg-gradient-to-r from-rose-400 to-amber-400 rounded-full mb-2.5" />

            {/* Important Info Grid */}
            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              {/* ISBN */}
              {book.isbn && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] uppercase tracking-wider text-white font-semibold">
                    ISBN
                  </span>
                  <span className="text-[10px] text-white truncate">
                    {book.isbn}
                  </span>
                </div>
              )}

              {/* Copies Available */}
              {showAvailability && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] uppercase tracking-wider text-white font-semibold">
                    Copies
                  </span>
                  <span className="text-[10px] text-white">
                    {availableCopies.length} available
                  </span>
                </div>
              )}
            </div>

            {/* Donation Info - Distinct and prominent */}
            {isDonated && (
              <div className="flex items-center gap-2 bg-gradient-to-r from-rose-500/20 to-pink-500/20 backdrop-blur-sm border border-rose-400/30 rounded-lg px-3 py-1.5 mb-2">
                <div className="p-1 bg-gradient-to-r from-rose-500/30 to-pink-500/30 rounded-full">
                  <Gift className="h-3.5 w-3.5 text-rose-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-rose-200/80 uppercase tracking-wider font-medium">
                    Community Donation
                  </p>
                  <p className="text-xs text-white font-medium truncate flex items-center gap-1">
                    <span>❤️</span>
                    {book.donate}
                  </p>
                </div>
              </div>
            )}

            {/* Publisher Info - if available */}
            {book.publisher && (
              <p className="text-[10px] text-white/40 truncate">
                {book.publisher}
              </p>
            )}
          </div>
        </div>

        {/* Persistent Bottom Bar */}
        <div
          className="absolute bottom-0 left-0 right-0 
                     bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm
                     px-3 py-2.5 border-t border-border/40 min-h-[44px] 
                     flex items-center justify-between 
                     group-hover:opacity-0 group-hover:pointer-events-none
                     transition-all duration-200 z-10"
        >
          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate pr-2">
            {book.title}
          </span>
          {isDonated && (
            <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
};
