
import React from "react";
import { Bookmark } from "lucide-react";
import { BookCard } from "./BookCard";
import { BookWithDetails } from "../types";


interface BookCarouselProps {
  title: string;
  books: BookWithDetails[];
  icon?: React.ReactNode;
  onBookClick?: (book: BookWithDetails) => void;
  showProgress?: boolean;
  showAvailability?: boolean;
}

export const BookCarousel: React.FC<BookCarouselProps> = ({
  title,
  books,
  icon,
  onBookClick,
  showProgress = false,
  showAvailability = false,
}) => {
  if (!books || books.length === 0) {
    return (
      <div className="bg-card/70 border border-border/50 rounded-2xl p-8 text-center text-muted-foreground">
        No books available
      </div>
    );
  }

  return (
    <section className="bg-card/70 border border-border/50 rounded-2xl p-4 shadow-xs backdrop-blur-xs mb-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5 text-navy font-semibold text-lg">
          {icon || <Bookmark className="h-4 w-4 text-royal fill-royal/20" />}
          <h2>{title}</h2>
        </div>
        <span className="text-xs text-muted-foreground/80 bg-muted/50 px-2 py-0.5 rounded-full font-medium">
          {books.length} Books
        </span>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-3 pt-1 scrollbar-none snap-x">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            variant="carousel"
            onClick={onBookClick}
            showProgress={showProgress}
            showAvailability={showAvailability}
          />
        ))}
      </div>
    </section>
  );
};
