import { BorrowStatus, CopyStatus, ReservationStatus } from "./Role";

export interface BookCopy {
  id: string;
  barcode: string;
  shelfLocation: string | null;
  status: CopyStatus;
  bookId: string;
}

export interface BorrowRecord {
  id: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate: Date | null;
  status: BorrowStatus;
  userId: string;
  copyId: string;
}

export interface Reservation {
  id: string;
  reservedAt: Date;
  status: ReservationStatus;
  userId: string;
  bookId: string;
}