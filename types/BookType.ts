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