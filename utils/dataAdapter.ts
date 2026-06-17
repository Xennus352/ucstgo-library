
import { BookWithDetails } from "@/components/students/types";

export function transformApiBooks(apiData: any[]): BookWithDetails[] {
  return apiData.map((book) => {
    // 1. Determine if a book is an Ebook or a Physical item
    const isEbook = book.ebook !== null && book.ebook !== undefined;

    // 2. Check if the book has any active user reservation counters
    const isReserved = book._count?.reservations > 0;

    // 3. Check if physical item is entirely checked out across all its copies
    const totalCopies = book.availability?.total || 0;
    const availableCopies = book.availability?.available || 0;
    const isBorrowed = totalCopies > 0 && availableCopies === 0;

    // 4. Set reading progress simulation (can map to ReadingHistory model values later)
    const readingProgress = isEbook ? 45 : 0; 

    return {
      ...book,
      publicationYear: book.publicationYear ?? null,
      description: book.description ?? null,
      publisher: book.publisher ?? null,
      coverImage: book.coverImage ?? null,
      readingProgress,
      isReserved,
      isBorrowed,
    } as BookWithDetails;
  });
}