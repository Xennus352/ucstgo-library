import { EbookAccessType, EbookFormat } from "./Role";

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