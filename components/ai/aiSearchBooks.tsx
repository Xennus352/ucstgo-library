"use client";

import { aiSearchBooks } from "@/app/actions/ai/aiSearchBooks";
import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  BookOpen,
  Calendar,
  Globe,
  X,
  Sparkles,
  Inbox,
} from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface Category {
  id: string;
  name: string;
}

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
  category: {
    id: string;
    name: string;
  };
  author: {
    id: string;
    name: string;
  };
}

// 1. Move animation configs completely outside the component function execution cycle.
// This prevents Framer Motion from recalculating objects on every state change/re-render.
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04, // Snappy cascading flow
      delayChildren: 0.02,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12, // Low displacement avoids layout thrashing
    scale: 0.99, // Tiny scaling modification looks cleaner on text blocks
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 26,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    transition: {
      duration: 0.15,
      ease: "easeOut",
    },
  },
};

const searchBarVariants: Variants = {
  idle: { scale: 1 },
  loading: {
    scale: 0.99,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

export function SearchSection() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const {
    data: categories,
    error,
    isLoading: categoriesLoading,
  } = useCategories();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const books = await aiSearchBooks(query);
      setResults(books as BookResult[]);
      setHasSearched(true);
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 px-1 sm:px-4 layout-gpu">
      {/* Search Input Container */}
      <motion.div
        className="relative group"
        animate={loading ? "loading" : "idle"}
        variants={searchBarVariants}
      >
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl opacity-0 group-hover:opacity-100 blur transition duration-500 pointer-events-none" />

        <div className="relative p-3 sm:p-5 backdrop-blur-md bg-slate-900/90 border border-white/10 rounded-xl shadow-xl">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 sm:flex-row sm:gap-3"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  isMobile
                    ? "Search for books..."
                    : "e.g., 'Find me a sci-fi book by Isaac Asimov'"
                }
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-800/50 text-white text-xs sm:text-sm border border-slate-700/50 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 placeholder-slate-400 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading || !query.trim()}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="
                relative px-4 py-2 sm:py-2.5
                bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 
                rounded-xl text-white font-semibold text-xs sm:text-sm
                hover:shadow-lg hover:shadow-cyan-500/25 
                disabled:opacity-50 disabled:cursor-not-allowed 
                transition-all duration-300
                flex items-center justify-center gap-2
                w-full sm:w-auto min-w-[110px]
              "
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Loader2 className="w-3.5 h-3.5" />
                  </motion.div>
                  <span>Searching</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>AI Search</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Suggestion tags */}
          <div className="mt-3 flex items-center gap-2 border-t border-slate-800/60 pt-2.5">
            <span className="text-[10px] text-slate-500 font-medium shrink-0 uppercase tracking-wider">
              Try:
            </span>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap pb-0.5 w-full">
              {categoriesLoading && (
                <span className="text-[10px] text-slate-500 animate-pulse">
                  Loading genres...
                </span>
              )}

              {!categoriesLoading &&
                !error &&
                (Array.isArray(categories)
                  ? categories
                  : (categories as any)?.data
                )?.map((cat: Category) => (
                  <motion.button
                    key={cat.id}
                    type="button"
                    onClick={() =>
                      setQuery(`Find me a ${cat.name.toLowerCase()} book`)
                    }
                    whileHover={{ scale: 1.03, y: -0.5 }}
                    whileTap={{ scale: 0.97 }}
                    className="
                      inline-block text-[10px] px-2.5 py-1 rounded-full 
                      bg-slate-800/40 text-slate-400 border border-slate-700/30 
                      hover:border-cyan-500/40 hover:text-cyan-400 hover:bg-cyan-500/5 
                      transition-all duration-200 cursor-pointer select-none shrink-0
                    "
                  >
                    {cat.name}
                  </motion.button>
                ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Loading state spinner */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-col items-center justify-center py-12 px-4 bg-slate-900/10 border border-slate-800/40 rounded-xl"
          >
            <div className="relative">
              <motion.div
                className="w-10 h-10 border-3 border-cyan-500/20 border-t-cyan-500 rounded-full"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="mt-3 text-slate-400 text-xs"
            >
              Consulting the AI librarian...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results View with staggered animations */}
      <AnimatePresence mode="wait">
        {!loading && results.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
            className="space-y-3"
          >
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-slate-400">
                Found{" "}
                <span className="text-white font-semibold">
                  {results.length}
                </span>{" "}
                books
              </p>
              <button
                onClick={clearSearch}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Clear results
              </button>
            </div>

            <div className="grid gap-3">
              {results.map((book) => (
                <motion.div
                  key={book.id}
                  variants={cardVariants}
                  transformTemplate={({ y, scale }) =>
                    `translate3d(0, ${y}, 0) scale(${scale})`
                  }
                  whileHover={{
                    scale: 1.005,
                    borderColor: "rgba(56, 189, 248, 0.25)",
                  }}
                  className="group relative p-3 sm:p-4 bg-gradient-to-br from-slate-900/90 to-slate-950/70 border border-white/5 rounded-xl hover:border-slate-700 transition-all duration-200 shadow-md hover:shadow-cyan-500/5 will-change-transform"
                >
                  <div className="flex gap-3 sm:gap-4 items-start">
                    {book.coverImage && (
                      <div className="flex-shrink-0">
                        <div className="relative w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 bg-slate-800 rounded-md overflow-hidden">
                          <img
                            src={`/api/files/${book.coverImage}`}
                            alt={book.title}
                            className="w-full h-full object-cover rounded-md shadow-md"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors line-clamp-2 leading-tight">
                            {book.title}
                          </h3>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            by{" "}
                            <span className="text-cyan-400 font-medium">
                              {book.author?.name || "Unknown Author"}
                            </span>
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full whitespace-nowrap self-start">
                          {book.category?.name || "General"}
                        </span>
                      </div>

                      {book.description && (
                        <p className="text-xs text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                          {book.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5 text-[10px] text-slate-500">
                        {book.publicationYear && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {book.publicationYear}
                          </span>
                        )}
                        {book.language && (
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {book.language.toUpperCase()}
                          </span>
                        )}
                        {book.publisher && (
                          <span className="hidden sm:flex items-center gap-1 truncate max-w-[150px]">
                            <BookOpen className="w-3 h-3" />
                            {book.publisher}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button className="text-[10px] px-2.5 py-1 rounded-md bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors">
                          View Details
                        </button>
                        <button className="text-[10px] px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors">
                          Summarize
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 3. Static/CSS-driven transition border line instead of an overlapping JS animation node */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-b-xl opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 origin-left ease-out pointer-events-none" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State - No results */}
      <AnimatePresence>
        {!loading && hasSearched && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex flex-col items-center justify-center text-center py-12 px-4 bg-slate-900/20 border border-dashed border-slate-800 rounded-xl"
          >
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 mb-3">
              <Inbox className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-200">
              No matching books found
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
              Our AI couldn't find matches for{" "}
              <span className="text-cyan-400">"{query}"</span>. Try describing a
              different concept, genre, or title.
            </p>
            <button
              onClick={clearSearch}
              className="mt-4 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700/50 transition-all"
            >
              Reset Search
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Initial State - No search yet */}
      <AnimatePresence>
        {!loading && !hasSearched && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
            className="flex flex-col items-center justify-center text-center py-12 px-4 bg-slate-900/10 border border-dashed border-slate-800/40 rounded-xl"
          >
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 mb-3 animate-pulse">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-300">
              Ask the Library AI
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
              Type anything into the engine. You can prompt by semester
              subjects, loosely defined genres, or complex semantic phrases.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
