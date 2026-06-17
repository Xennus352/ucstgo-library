import React from "react";
import { BookCard } from "./BookCard";
import { BookWithDetails, ViewMode } from "../types";

interface BookGridProps {
  books: BookWithDetails[];
  onBookClick?: (book: BookWithDetails) => void;
  variant?: ViewMode;
  showProgress?: boolean;
  showLocation?: boolean;
  showRating?: boolean;
  showAvailability?: boolean;
}

export const BookGrid: React.FC<BookGridProps> = ({
  books,
  onBookClick,
  variant = "grid",
  showProgress = false,
  showLocation = false,
  showRating = false,
  showAvailability = false,
}) => {
  if (!books || books.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No books found
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            variant="list"
            onClick={onBookClick}
            showProgress={showProgress}
            showLocation={showLocation}
            showRating={showRating}
            showAvailability={showAvailability}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          variant="grid"
          onClick={onBookClick}
          showProgress={showProgress}
          showRating={showRating}
          showAvailability={showAvailability}
        />
      ))}
    </div>
  );
};
