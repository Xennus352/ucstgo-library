"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

// A clean mapping of your route paths to the display titles
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
};

export function SiteHeader() {
  const pathname = usePathname();

  //  Look for a matching title in our predefined map
  //  Fall back to a formatted version of the last path segment if not mapped
  const getHeaderTitle = () => {
    if (routeTitles[pathname]) {
      return routeTitles[pathname];
    }

    // Fallback parser (e.g., /admin/student-profiles -> "Student Profiles")
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Dashboard";

    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        {/* Render the dynamic title here */}
        <h1 className="text-base font-medium">{getHeaderTitle()}</h1>
      </div>
    </header>
  );
}
