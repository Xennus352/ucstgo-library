"use client";
import React from "react";
import { Book, CheckCircle, MapPin, Star } from "lucide-react";
import { BookCopy, BookWithDetails } from "../types";
import { CopyStatus } from "@/app/generated/prisma/enums";

interface BookCardProps {
  book: BookWithDetails;
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

  // Get available copies
  const availableCopies =
    book.copies?.filter(
      (copy: BookCopy) => copy.status === CopyStatus.AVAILABLE,
    ) || [];

  const isAvailable = availableCopies.length > 0;
  const totalCopies = book.copies?.length || 0;

  // Get cover color based on category or generate one
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
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-black/10 rounded-l-xs" />
          <span className="text-[10px] uppercase tracking-wider opacity-70 font-bold block truncate">
            {book.ebook ? "Ebook" : "Physical"}
          </span>
          <p className="font-serif font-bold text-xs leading-tight line-clamp-3 my-auto">
            {book.title}
          </p>
          <p className="text-[9px] truncate opacity-80 text-right font-medium">
            {book.author?.name || "Unknown Author"}
          </p>
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
          {book.coverImage ? (
            <img
              src={book.coverImage}
              alt={book.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Book className="h-6 w-6 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-navy group-hover:text-royal truncate">
                {book.title}
              </p>
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

  // Grid variant (default) normal design
  // return (
  //   <div
  //     onClick={handleClick}
  //     className="bg-card border border-border/40 rounded-xl p-3 flex flex-col items-center text-center shadow-xs hover:shadow-md transition-shadow group cursor-pointer w-full"
  //   >
  //     {/* Aspect ratio container wrapper */}
  //     <div
  //       className={`w-full aspect-3/4 ${coverColor} border border-dashed border-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground/60 group-hover:bg-sky/5 group-hover:border-sky/40 transition-colors relative overflow-hidden`}
  //     >
  //       {book.coverImage ? (
  //         <img
  //           src={book.coverImage}
  //           alt={book.title}
  //           className="absolute inset-0 w-full h-full object-cover p-2"
  //         />
  //       ) : (
  //         <>
  //           <div className="absolute inset-0 opacity-10 flex items-center justify-center">
  //             <div className="w-[141%] h-px bg-foreground rotate-45 absolute" />
  //             <div className="w-[141%] h-px bg-foreground -rotate-45 absolute" />
  //           </div>
  //           <Book className="h-5 w-5 mb-1 text-muted-foreground/40 group-hover:text-royal/60 transition-colors" />
  //           <span className="text-[10px] font-medium tracking-tight">
  //             Book Cover
  //           </span>
  //         </>
  //       )}

  //       {book.readingProgress !== undefined &&
  //         book.readingProgress > 0 &&
  //         book.readingProgress < 100 && (
  //           <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10">
  //             <div className="w-full h-1 bg-muted/60 rounded-full overflow-hidden">
  //               <div
  //                 className="h-full bg-royal rounded-full transition-all duration-500"
  //                 style={{ width: `${book.readingProgress}%` }}
  //               />
  //             </div>
  //           </div>
  //         )}
  //       {book.readingProgress === 100 && (
  //         <div className="absolute top-1.5 right-1.5 z-10">
  //           <CheckCircle className="h-4 w-4 text-green-500" />
  //         </div>
  //       )}
  //       {showAvailability && (
  //         <div
  //           className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold z-10 ${
  //             isAvailable ? "bg-green-500 text-white" : "bg-red-500 text-white"
  //           }`}
  //         >
  //           {isAvailable ? "Available" : "Unavailable"}
  //         </div>
  //       )}
  //       <span className="absolute bottom-1.5 px-1 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold bg-muted/60 text-muted-foreground z-10">
  //         {book.ebook ? "Ebook" : "Physical"}
  //       </span>
  //     </div>
  //     <p className="text-xs font-bold text-navy mt-2.5 line-clamp-1 w-full group-hover:text-royal">
  //       {book.title}
  //     </p>
  //     <p className="text-[11px] text-muted-foreground line-clamp-1 w-full mt-0.5">
  //       {book.author?.name || "Unknown Author"}
  //     </p>
  //     {book.publicationYear && (
  //       <p className="text-[10px] text-muted-foreground mt-0.5">
  //         {book.publicationYear}
  //       </p>
  //     )}
  //   </div>
  // );

  // Grid variant (default)
  return (
    <div
      onClick={handleClick}
      className="group relative bg-card border border-border/40 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer w-full h-80"
    >
      {/* Cover Image/Color Container */}
      <div
        className={`w-full h-full ${coverColor} border border-dashed border-muted rounded-lg flex flex-col items-center justify-center text-muted-foreground/60 transition-colors relative overflow-hidden`}
      >
        {book.coverImage ? (
          <img
            src={book.coverImage}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover p-2"
          />
        ) : (
          <>
            <div className="absolute inset-0 opacity-10 flex items-center justify-center">
              <div className="w-[141%] h-px bg-foreground rotate-45 absolute" />
              <div className="w-[141%] h-px bg-foreground -rotate-45 absolute" />
            </div>
            <Book className="h-5 w-5 mb-1 text-muted-foreground/40 group-hover:text-royal/60 transition-colors" />
            <span className="text-[10px] font-medium tracking-tight">
              Book Cover
            </span>
          </>
        )}

        {book.readingProgress !== undefined &&
          book.readingProgress > 0 &&
          book.readingProgress < 100 && (
            <div className="absolute bottom-1.5 left-1.5 right-1.5 z-10">
              <div className="w-full h-1 bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-royal rounded-full transition-all duration-500"
                  style={{ width: `${book.readingProgress}%` }}
                />
              </div>
            </div>
          )}
        {book.readingProgress === 100 && (
          <div className="absolute top-1.5 right-1.5 z-10">
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        )}
        {showAvailability && (
          <div
            className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold z-10 ${
              isAvailable ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {isAvailable ? "Available" : "Unavailable"}
          </div>
        )}
        <span className="absolute bottom-4 px-1 py-0.5 rounded text-[8px] uppercase tracking-widest font-bold bg-muted/60 text-muted-foreground z-10">
          {book.ebook ? "Ebook" : "Physical"}
        </span>
      </div>

      {/* Sliding Data Panel  */}
      <div
        className="absolute bottom-0 left-0 right-0 mx-auto w-[90%]
             bg-white/70
             backdrop-blur-md
             border border-white/40
             shadow-xl
             rounded-t-xl
             p-4
             translate-y-[calc(100%-2.5rem)] opacity-0 pointer-events-none
             group-hover:-translate-y-4 group-hover:opacity-100 group-hover:pointer-events-auto
             transition-all duration-500 ease-out z-20"
      >
        <div className="space-y-2">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">
              Title
            </p>
            <p className="text-xs font-bold text-slate-900 line-clamp-1">
              {book.title}
            </p>
          </div>

          <div>
            <p className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">
              Author
            </p>
            <p className="text-[11px] text-slate-800 line-clamp-1">
              {book.author?.name || "Unknown Author"}
            </p>
          </div>

          {book.publicationYear && (
            <div>
              <p className="text-[9px] uppercase tracking-wider text-slate-500 font-medium">
                Published
              </p>
              <p className="text-[11px] text-slate-800">
                {book.publicationYear}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
