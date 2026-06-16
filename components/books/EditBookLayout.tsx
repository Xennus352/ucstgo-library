"use client";

import { ComponentProps, ReactNode, useState } from "react";
import { Edit2, Eye } from "lucide-react";
import { BookPreviewCard } from "./BookPreview"; 

interface EditBookLayoutProps {
  children: ReactNode; 
  bookData: ComponentProps<typeof BookPreviewCard>; 
}

export function EditBookLayout({ children, bookData }: EditBookLayoutProps) {
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* LEFT COLUMN: Form Area */}
      <div className="lg:col-span-8 space-y-4">
        
        {/* Mobile Tabs (Only visible on small screens) */}
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg lg:hidden">
          <button
            onClick={() => setActiveTab("form")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-md transition-all ${
              activeTab === "form"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            <Edit2 className="w-4 h-4" />
            Edit Book
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-md transition-all ${
              activeTab === "preview"
                ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        </div>

        {/* Form Content Wrapper */}
        <div className={activeTab === "form" ? "block" : "hidden lg:block"}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-indigo-600" />
            <div className="p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Book Details
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Update the metadata for this resource.
                </p>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Preview Area */}
      <div className="lg:col-span-4 xl:col-span-3">
        
        {/* Desktop Label (Only visible on large screens) */}
        <div className="hidden lg:flex items-center justify-between mb-4 px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Library Card Preview
          </h3>
          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            READ ONLY
          </span>
        </div>

        {/* Preview Card Content Wrapper */}
        <div className={activeTab === "preview" ? "block" : "hidden lg:block"}>
          <BookPreviewCard {...bookData} />
        </div>

      </div>

    </div>
  );
}