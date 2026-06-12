export type Role = 'ADMIN' | 'LIBRARIAN' | 'STUDENT' | 'LECTURER';

export type CopyStatus = 'AVAILABLE' | 'BORROWED' | 'LOST' | 'DAMAGED';

export type BorrowStatus = 'BORROWED' | 'RETURNED' | 'OVERDUE';

export type ReservationStatus = 'PENDING' | 'FULFILLED' | 'CANCELLED';

export type EbookFormat = 'PDF' | 'EPUB' | 'DOCX';

export type EbookAccessType = 'OPEN' | 'STUDENT_ONLY' | 'LECTURER_ONLY' | 'ADMIN_ONLY';