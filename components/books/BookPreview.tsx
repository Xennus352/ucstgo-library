"use client";

import {
  BookOpen,
  Tag,
  Layers,
  X,
  FileText,
  MapPin,
  GraduationCap,
  HeartHandshake,
} from "lucide-react";

interface BookPreviewCardProps {
  title: string;
  description: string;
  author: string;
  category: string;
  isbn: string;
  publicationYear: string;
  copies: number;
  coverUrl: string | null;
  hasEbook: boolean;
  semester?: string; // Added optional semester string
  donate?: string; // Added optional donation string
  shelfLocation?: string;
  onRemoveCover?: () => void;
}

export function BookPreviewCard({
  title,
  description,
  author,
  category,
  isbn,
  publicationYear,
  copies,
  coverUrl,
  hasEbook,
  semester, // Destructured semester
  donate, // Destructured donate
  shelfLocation,
  onRemoveCover,
}: BookPreviewCardProps) {
  // Clean label generator for formatting backend enums (e.g., Y1_SEM1 -> Year 1 - Sem 1)
  const formatSemesterLabel = (sem?: string) => {
    if (!sem) return "";
    return sem.replace("Y", "Year ").replace("_SEM", " - Sem ");
  };

  return (
    <div className="sticky top-6">
      <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md overflow-hidden">
        {/* Cover Image */}
        <div className="relative bg-slate-100 dark:bg-slate-800 flex justify-center p-8 border-b border-slate-200 dark:border-slate-700">
          {coverUrl ? (
            <div className="relative group shadow-xl shadow-slate-200 dark:shadow-black/20">
              <img
                src={coverUrl}
                alt="Cover preview"
                className="w-36 h-52 object-cover rounded-md"
              />
              {onRemoveCover && (
                <button
                  onClick={onRemoveCover}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-36 h-52 bg-slate-200 dark:bg-slate-700 rounded-md flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 shadow-inner">
              <BookOpen className="w-10 h-10 text-slate-400 mb-2" />
              <span className="text-xs font-medium text-slate-400">
                No Cover
              </span>
            </div>
          )}
        </div>

        {/* Book Details */}
        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
              {title || "Untitled Book"}
            </h3>
          </div>

          {/* Description */}
          {description && (
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg">
              <p className="text-xs text-slate-500 mb-1 font-medium">
                Description
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug line-clamp-3">
                {description}
              </p>
            </div>
          )}

          {/* Donation Badge / Info (Rendered conditionally below title/description) */}
          {donate && (
            <div className="flex items-center gap-2 bg-pink-50 dark:bg-pink-950/20 text-pink-700 dark:text-pink-400 px-3 py-2 rounded-lg text-xs font-medium border border-pink-100 dark:border-pink-900/30">
              <HeartHandshake className="w-4 h-4 shrink-0" />
              <span className="truncate">Donation: {donate}</span>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Book Copies */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Copies
                </span>
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                {copies}
              </span>
            </div>

            {/* Shelf Location */}
            {shelfLocation && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    Location
                  </span>
                </div>
                <span className="font-bold text-lg text-slate-900 dark:text-white font-mono">
                  {shelfLocation}
                </span>
              </div>
            )}
          </div>

          {/* Metadata List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="text-slate-500 flex items-center gap-2">
                <span className="text-xs">✍️</span> Author
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-200 truncate max-w-[150px]">
                {author || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="text-slate-500 flex items-center gap-2">
                <span className="text-xs">📅</span> Year
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-200">
                {publicationYear || "—"}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
              <span className="text-slate-500 flex items-center gap-2">
                <Tag className="w-3 h-3" /> Category
              </span>
              <span className="font-medium text-slate-900 dark:text-slate-200 truncate max-w-[150px]">
                {category || "—"}
              </span>
            </div>

            {/* Target Curriculum Semester (Only visible if an E-Book is uploaded with a selected semester) */}
            {hasEbook && semester && (
              <div className="flex items-center justify-between text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                <span className="text-slate-500 flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5" /> Semester
                </span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {formatSemesterLabel(semester)}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-mono">
              ISBN: {isbn || "N/A"}
            </span>
            {hasEbook && (
              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded text-xs font-medium border border-emerald-100 dark:border-emerald-900/30">
                <FileText className="w-3 h-3" />
                <span>E-Book</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
