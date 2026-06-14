"use client";

import { BookOpen, Tag, Layers, X, FileText, MapPin } from "lucide-react";

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
  shelfLocation?: string;
  onRemoveCover: () => void;
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
  shelfLocation,
  onRemoveCover,
}: BookPreviewCardProps) {
  return (
    <div className="sticky top-6">
      <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Cover Image - Full width at top */}
        <div className="relative bg-slate-100 dark:bg-slate-800 flex justify-center p-6">
          {coverUrl ? (
            <div className="relative group">
              <img
                src={coverUrl}
                alt="Cover preview"
                className="w-32 h-42 object-cover rounded-lg shadow-md"
              />
              <button
                onClick={onRemoveCover}
                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="w-32 h-42 bg-slate-200 dark:bg-slate-700 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600">
              <BookOpen className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs text-slate-500">No Cover</span>
            </div>
          )}
        </div>

        {/* Book Details - Vertical list */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              {title || "Untitled Book"}
            </h3>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-slate-500 mb-1">Description</p>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {description || "No description provided"}
            </p>
          </div>

          {/* Book Copies */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Book copies
              </span>
            </div>
            <span className="font-semibold text-slate-900 dark:text-white">
              {copies}
            </span>
          </div>

          {/* Shelf Location - New */}
          {shelfLocation && (
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Shelf Location
                </span>
              </div>
              <span className="text-sm font-mono text-slate-900 dark:text-white">
                {shelfLocation}
              </span>
            </div>
          )}

          {/* Author */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <span className="text-slate-400 text-xs">✍️</span>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Author
              </span>
            </div>
            <span className="text-sm text-slate-900 dark:text-white">
              {author || "Not specified"}
            </span>
          </div>

          {/* Publish Year */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <span className="text-slate-400 text-xs">📅</span>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Publish Year
              </span>
            </div>
            <span className="text-sm text-slate-900 dark:text-white">
              {publicationYear || "Not specified"}
            </span>
          </div>

          {/* Category */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Category
              </span>
            </div>
            <span className="text-sm text-slate-900 dark:text-white">
              {category || "Not specified"}
            </span>
          </div>

          {/* ISBN */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <span className="text-slate-400 text-xs">📖</span>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                ISBN
              </span>
            </div>
            <span className="text-sm font-mono text-slate-900 dark:text-white">
              {isbn || "Not specified"}
            </span>
          </div>

          {/* Ebook indicator (optional) */}
          {hasEbook && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-emerald-600">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-medium">Ebook included</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
