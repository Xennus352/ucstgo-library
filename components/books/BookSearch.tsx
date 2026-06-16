"use client";

import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export function BookSearch({
  onSearch,
  onCategoryChange,
  onStatusChange,
}: {
  onSearch: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onStatusChange: (val: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Fetch categories from database
  const { data: categoriesData, isLoading: categoriesLoading } = useSWR(
    "/api/books/categories",
    fetcher,
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, onSearch]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategoryChange(categoryId);
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    onStatusChange(status);
  };

  const categories = categoriesData?.data || [];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by title, author, ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white dark:bg-slate-800"
          />
        </div>
        <div className="flex gap-3">
          <select
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-800"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="">All Categories</option>
            {categoriesLoading ? (
              <option disabled>Loading categories...</option>
            ) : (
              categories.map((category: any) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))
            )}
          </select>

{/* //TODO:Status */}
          {/* <select
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white dark:bg-slate-800"
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="available">Available</option>
            <option value="borrowed">Borrowed</option>
            <option value="reserved">Reserved</option>
            <option value="damaged">Damaged</option>
            <option value="lost">Lost</option>
          </select> */}

          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("");
              setSelectedStatus("");
              onSearch("");
              onCategoryChange("");
              onStatusChange("");
            }}
          >
            <Filter className="w-4 h-4" />
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
