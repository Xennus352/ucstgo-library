"use client";

import { recommendBooks } from "@/app/actions/ai/recommendBooks";
import { useEffect, useState } from "react";

interface BookResult {
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

export function RecommendationsSection({ userId }: { userId: string }) {
  const [books, setBooks] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const data = await recommendBooks(userId);
        setBooks(data as BookResult[]);
      } catch (error) {
        console.error("Error getting recommendations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendations();
  }, [userId]);

  if (loading) {
    return (
      <div className="text-center py-6 text-slate-400 animate-pulse">
        Analyzing your reading patterns...
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto text-center py-8">
        <p className="text-slate-400">
          No recommendations available right now. Start reading more books to
          get personalized suggestions!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        AI Recommended For You
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {books.map((book) => (
          <div
            key={book.id}
            className="p-4 backdrop-blur-md bg-white/5 border border-white/10 rounded-xl flex gap-4 hover:border-slate-700 transition-all shadow-lg"
          >
            {book.coverImage && (
              <img
                src={`/api/files/${book.coverImage}`}
                alt={book.title}
                className="w-16 h-24 object-cover rounded bg-slate-800 flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white truncate">
                {book.title}
              </h3>
              {book.description && (
                <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {book.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
