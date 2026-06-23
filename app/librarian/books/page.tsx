"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Plus, FileUp } from "lucide-react";
import { BookZipImport } from "@/components/books/BookZipImport";
import { BookStats } from "@/components/books/BookStats";
import { BookSearch } from "@/components/books/BookSearch";
import { BookTable } from "@/components/books/BookTable";
import { ImportModal } from "@/components/books/ImportModal";
import { fetcher } from "@/lib/fetcher";
import AlertModal from "@/components/AlertModal";

export default function BooksPage() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Build query parameters
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "20",
    ...(searchQuery && { q: searchQuery }),
    ...(categoryFilter && { categoryId: categoryFilter }),
    ...(statusFilter && { status: statusFilter }),
  });

  // SWR automatically re-fetches when search, category, status, or page changes
  const { data, mutate, isLoading } = useSWR(
    `/api/books?${queryParams.toString()}`,
    fetcher,
    { keepPreviousData: true },
  );

  // Delete Handler
  const handleDelete = async (id: string) => {
    await fetch(`/api/books/${id}`, { method: "DELETE" });
    mutate(); // Instantly refresh SWR layout cache
  };

  // Edit Handler
  const handleEdit = (id: string) => {
    window.location.href = `/librarian/books/edit/${id}`;
  };

  const books = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className=" ">
      <div className="px-4 lg:px-8 py-8">
        {/* Header Section */}
        <div className="rounded-xl border bg-white p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                Books Catalog
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* THE NEW BROADCAST BUTTON */}
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(true)}
                className={`
    relative group px-5 py-2.5
    bg-gradient-to-r from-amber-400/10 to-amber-500/10
    hover:from-amber-400/20 hover:to-amber-500/20
    border-2 border-amber-400/30 hover:border-amber-500/50
    rounded-xl
    font-medium text-amber-700 dark:text-amber-400
    hover:text-amber-800 dark:hover:text-amber-300
    transition-all duration-300
    hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/20
    active:scale-[0.97]
    hover:cursor-pointer
    overflow-hidden
    backdrop-blur-sm
  `}
              >
                {/* Animated Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-amber-400/0 to-amber-500/0 group-hover:from-amber-400/20 group-hover:via-amber-400/20 group-hover:to-amber-500/30 transition-all duration-500" />

                {/* Shimmer Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-amber-400/20 to-transparent" />

                <div className="relative flex items-center gap-2.5">
                  <span className="text-base group-hover:scale-110 transition-transform duration-300">
                    📢
                  </span>
                  <span className="relative">
                    Send Alert
                    {/* Underline Animation */}
                    <span className="absolute -bottom-0.5 left-0 w-0 group-hover:w-full h-0.5 bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-300" />
                  </span>
                  {/* Pulse Ring */}
                  <span className="relative flex h-2 w-2 ml-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                </div>
              </Button>
              <Button
                className="hover:cursor-pointer"
                onClick={() => setShowImportModal(true)}
                variant="outline"
              >
                <FileUp className="w-4 h-4 mr-2" /> Bulk Import
              </Button>

              <Link href="/librarian/books/create">
                <Button className="hover:cursor-pointer">
                  <Plus className="w-4 h-4 mr-2" /> Create New Book
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <BookStats />

        <BookSearch
          onSearch={(val) => {
            setSearchQuery(val);
            setPage(1);
          }}
          onCategoryChange={(val) => {
            setCategoryFilter(val);
            setPage(1);
          }}
          onStatusChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
        />

        {showImportModal && (
          <ImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
          >
            <BookZipImport
              onComplete={() => {
                setShowImportModal(false);
                mutate();
              }}
            />
          </ImportModal>
        )}

        {/* Books Table */}
        <BookTable
          data={books}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-muted-foreground">
            {pagination
              ? `Showing ${books.length} of ${pagination.total} results`
              : "Loading..."}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination?.hasNextPage || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
      {/* THE MODAL INJECTED HERE */}
      <AlertModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
