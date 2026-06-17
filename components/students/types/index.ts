import {
  EbookAccessType,
  EbookFormat,
  BorrowStatus,
  CopyStatus,
  ReservationStatus,
  Role,
} from "@/types/Role";

export interface Book {
  id: string;
  isbn: string;
  title: string;
  description: string | null;
  publisher: string | null;
  publicationYear: number | null;
  language: string;
  coverImage: string | null;
  categoryId: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
}

export interface Author {
  id: string;
  name: string;
  bio: string | null;
}

export interface Ebook {
  id: string;
  filePath: string;
  fileSize: number | null;
  format: EbookFormat;
  accessType: EbookAccessType;
  bookId: string;
  createdAt: Date;
}

export interface ReadingHistory {
  id: string;
  lastPage: number;
  progress: number;
  readingTime: number;
  updatedAt: Date;
  userId: string;
  ebookId: string;
}

export interface Bookmark {
  id: string;
  pageNumber: number;
  note: string | null;
  createdAt: Date;
  userId: string;
  ebookId: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  userId: string;
}

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

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  studentId: string | null;
  role: Role;
  faculty: string | null;
  phone: string | null;
  banned: boolean;
}

export interface Session {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string;
}

export interface Account {
  id: string;
  accountId: string;
  providerId: string;
  userId: string;
  accessToken: string | null;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: Date | null;
  refreshTokenExpiresAt: Date | null;
  scope: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Verification {
  id: string;
  identifier: string;
  value: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// UI Helper Types (not in database)
export interface BookWithDetails extends Book {
  author: Author;
  category: Category;
  ebook?: Ebook;
  copies?: BookCopy[];
  readingProgress?: number;
  isReserved?: boolean;
  isBorrowed?: boolean;
  filePath: string;
}

export interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
}

export type ViewMode = "grid" | "list";
export type TabId = "Explore" | "eBooks" | "Physical" | "Profile";
