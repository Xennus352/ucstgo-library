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

export default function BooksPage() {
  const [showImportModal, setShowImportModal] = useState(false);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
    if (!confirm("Are you sure you want to delete this book?")) return;

    await fetch(`/api/books/${id}`, { method: "DELETE" });
    mutate(); // Refresh the data list
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
    </div>
  );
}
