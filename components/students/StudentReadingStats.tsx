"use client";

import { useEffect, useMemo } from "react";
import useSWR from "swr";
import { getTopBorrowers, getTopBorrowedBooks } from "@/app/actions/analytics";
import { useSocketEvent } from "@/hooks/use-socket";
import { Trophy, Medal, BookOpen, TrendingUp } from "lucide-react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";

function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toString());
  useEffect(() => { mv.set(value); }, [value, mv]);
  return <motion.span>{display}</motion.span>;
}

function anonymize(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

const readersFetcher = () => getTopBorrowers();
const booksFetcher = () => getTopBorrowedBooks();

export function StudentReadingStats() {
  const { data: readersData, mutate: mutateReaders } = useSWR("top-readers", readersFetcher, {
    revalidateOnFocus: false, revalidateOnReconnect: false,
  });
  const { data: booksData, mutate: mutateBooks } = useSWR("top-books", booksFetcher, {
    revalidateOnFocus: false, revalidateOnReconnect: false,
  });

  const refresh = () => { mutateReaders(); mutateBooks(); };
  useSocketEvent("borrow:created", refresh);
  useSocketEvent("borrow:returned", refresh);

  const readers = readersData?.success ? (readersData.data || []) : [];
  const books = booksData?.success ? (booksData.data || []) : [];

  if (readers.length === 0 && books.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-lg text-slate-800">Trending</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TOP READERS */}
        {readers.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-semibold text-slate-700">Top Readers</h4>
            </div>
            <div className="space-y-2">
              {readers.map((reader, i) => {
                const RankIcon = i < 3 ? [Trophy, Medal, Medal][i] : undefined;
                const rankColor = ["text-amber-500", "text-slate-400", "text-amber-700"][i] || "text-slate-500";
                return (
                  <motion.div
                    key={reader.id}
                    layout
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 flex items-center justify-center shrink-0 ${rankColor}`}>
                        {RankIcon ? <RankIcon className="w-5 h-5" /> : <span className="text-sm font-bold">{i + 1}</span>}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {anonymize(reader.name)}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {reader.role === "STUDENT" ? "Student" : reader.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 shrink-0 ml-3">
                      <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                      <AnimatedNumber value={reader.borrowCount} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* TOP BOOKS */}
        {books.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-semibold text-slate-700">Most Borrowed Books</h4>
            </div>
            <div className="space-y-2">
              {books.map((book, i) => (
                <motion.div
                  key={book.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 flex items-center justify-center shrink-0 text-slate-500">
                      <span className="text-sm font-bold">{i + 1}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {book.title}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {book.categoryName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600 shrink-0 ml-3">
                    <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                    <AnimatedNumber value={book.borrowCount} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}
