"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname, useRouter, useSearchParams } from "next/navigation"; 
import { SearchBar } from "./students/ui/SearchBar";

const routeTitles: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/students": "Student Management",
  "/admin/librarians": "Librarian Management",
  "/admin/books": "Books Catalog",
  "/admin/users/approvals": "Account Approvals",
  "/admin/data-library": "Data Library",
  "/admin/reports": "System Reports",
  "/admin/settings": "System Settings",
  "/admin/help": "Get Help",
  "/admin/search": "Global Search",

  // Lecturer Routes
  "/lecturer/home": "Lecturer Home",
  "/lecturer/ebooks": "E-Books Catalog",
  "/lecturer/books": "Books Catalog",
};

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Sync local search bar text with whatever is in the URL
  const currentSearchQuery = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(currentSearchQuery);

  // Sync state if URL changes externally or if changing paths
  useEffect(() => {
    setSearchQuery(currentSearchQuery);
  }, [currentSearchQuery, pathname]);

  const getHeaderTitle = () => {
    if (routeTitles[pathname]) return routeTitles[pathname];
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Dashboard";
    const lastSegment = segments[segments.length - 1];
    return lastSegment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const showSearchBar = [
    "/lecturer/home",
    "/lecturer/ebooks",
    "/lecturer/books",
  ].includes(pathname);

  // Push the search query into the URL parameters
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    
    // Updates URL without full page reload
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-1 lg:gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <h1 className="text-base font-medium">{getHeaderTitle()}</h1>
        </div>

        {showSearchBar && (
          <div className="flex items-center">
            <SearchBar
              value={searchQuery}
              placeholder={`Search in ${getHeaderTitle()}...`}
              onChange={handleSearchChange}
            />
          </div>
        )}
      </div>
    </header>
  );
}