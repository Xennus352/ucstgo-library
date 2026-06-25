"use client";

import { useState } from "react";
import { Search, Loader2, MessageSquare, Inbox } from "lucide-react";

interface Book {
  id: string;
  title: string;
  description?: string | null;
  category?: { name: string };
  author?: { name: string };
  coverImage?: string | null;
}

interface ApiResponse {
  type: string;
  answer: string;
  books?: Book[];
}

export function ChatSection() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const [answer, setAnswer] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      // Hit your Route Handler endpoint directly
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: query }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI server route");
      }

      const res: ApiResponse = await response.json();

      setAnswer(res.answer);
      setBooks(res.books || []);
    } catch (err) {
      console.error(err);
      setAnswer("တစ်ခုခုမှားယွင်းနေပါတယ်နော် 🙂");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setQuery("");
    setAnswer("");
    setBooks([]);
    setSearched(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      {/* INPUT */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask library..."
          className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white border border-slate-700 focus:outline-none focus:border-slate-500 text-sm"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg flex items-center gap-2 text-sm transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Ask
        </button>
      </form>

      {/* LOADING */}
      {loading && (
        <div className="text-center text-slate-400 text-xs py-4 animate-pulse">
          Searching library...
        </div>
      )}

      {/* ANSWER */}
      {!loading && answer && (
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-700">
          <div className="flex items-center gap-2 text-cyan-400 text-xs mb-1 font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            AI Librarian
          </div>
          <p className="text-white text-sm whitespace-pre-line leading-relaxed">
            {answer}
          </p>
        </div>
      )}

      {/* BOOKS */}
      {!loading && books.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400 px-1">
            <span>{books.length} books found</span>
            <button
              onClick={clear}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>

          <div className="space-y-2">
            {books.map((b) => (
              <div
                key={b.id}
                className="p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors"
              >
                <h3 className="text-white font-medium text-sm">{b.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {b.author?.name || "Unknown Author"} •{" "}
                  <span className="text-cyan-500">
                    {b.category?.name || "General"}
                  </span>
                </p>
                {b.description && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {b.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMPTY & DEFAULT INITIAL STATES */}
      {!loading && !books.length && (
        <div className="text-center text-slate-500 text-sm border border-dashed border-slate-800 p-6 rounded-lg">
          <Inbox className="mx-auto mb-2 w-5 h-5 text-slate-600" />
          {searched ? (
            <div className="text-xs text-slate-400">
              ရှာဖွေမှုနှင့်ကိုက်ညီသော စာအုပ်မတွေ့ရှိပါနော် 🙂
            </div>
          ) : (
            <>
              Ask something like:
              <div className="text-xs mt-2 text-slate-400 italic">
                “I’m bored, suggest books”
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
