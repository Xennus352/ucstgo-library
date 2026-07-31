"use client";

import { CatalogManager } from "@/components/catalog/CatalogManager";

export default function AdminAuthorsPage() {
  return (
    <div className="px-4 lg:px-8 py-8">
      <div className="rounded-xl border bg-white p-4 mb-6 dark:bg-slate-900/60 dark:border-slate-800/40">
        <h1 className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
          Authors
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Create, edit, and manage book authors for the library catalog.
        </p>
      </div>
      <CatalogManager entity="author" />
    </div>
  );
}
