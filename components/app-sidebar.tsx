"use client";

import * as React from "react";
import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  LayoutDashboardIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  BookSearch,
  GraduationCapIcon,
  ShieldCheckIcon,
  BookOpenIcon,
  UserCheckIcon,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePathname } from "next/navigation";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading, error } = useCurrentUser();
  const pathname = usePathname();

  // Define navigation data (static, doesn't depend on user)
  const navData = {
    navMain: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
        icon: <LayoutDashboardIcon />,
      },
      {
        title: "Student Management",
        url: "/admin/students",
        icon: <GraduationCapIcon />,
      },
      {
        title: "Librarian Management",
        url: "/admin/librarians",
        icon: <ShieldCheckIcon />,
      },
      {
        title: "Teacher Management",
        url: "/admin/teachers",
        icon: <UserCheckIcon />,
      },
      {
        title: "Library Management",
        url: "#", // Parent doesn't need a direct URL if it's a folder
        icon: <BookOpenIcon />,
        items: [
          { title: "Books", url: "/admin/books" },
          { title: "Physical Inventory", url: "/admin/inventory" },
          { title: "Borrowing", url: "/admin/borrowing" },
          { title: "Reservations", url: "/admin/reservations" },
        ],
      },
      {
        title: "Digital Library",
        url: "#",
        icon: <DatabaseIcon />,
        items: [
          { title: "Ebooks", url: "/admin/ebooks" },
          { title: "Reading Analytics", url: "/admin/analytics" },
        ],
      },
    ],
    navSecondary: [
      {
        title: "System Settings",
        url: "#",
        icon: <Settings2Icon />,
      },
      {
        title: "Get Help",
        url: "#",
        icon: <CircleHelpIcon />,
      },
      {
        title: "Global Search",
        url: "#",
        icon: <SearchIcon />,
      },
    ],
    // documents: [
    //   {
    //     name: "Data Library",
    //     url: "#",
    //     icon: <DatabaseIcon />,
    //   },
    //   {
    //     name: "System Reports",
    //     url: "#",
    //     icon: <FileChartColumnIcon />,
    //   },
    // ],
  };

  // Create user data (fallback for loading/error states)
  const userData = {
    name: isLoading ? "Loading..." : error ? "Error" : user?.name || "Guest",
    email: isLoading
      ? "Please wait..."
      : error
        ? "Failed to load"
        : user?.email || "Not logged in",
    avatar: "/avatars/admin.jpg",
  };

  const activeStyles =
    "bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-white/50 text-blue-700 dark:text-blue-300 font-medium shadow-sm rounded-lg";
  const hoverStyles =
    "hover:bg-white/30 hover:text-blue-800 transition-all duration-200";

  const mainItemsWithActive = navData.navMain.map((item) => {
    const isCurrent = pathname === item.url;
    return {
      ...item,
      isActive: isCurrent,
      className: isCurrent ? activeStyles : hoverStyles,
    };
  });

  // TODO:Delete later
  // const documentItemsWithActive = navData.documents.map((item) => {
  //   const isCurrent = pathname === item.url;
  //   return {
  //     ...item,
  //     isActive: isCurrent,
  //     className: isCurrent ? activeStyles : hoverStyles,
  //   };
  // });

  const secondaryItemsWithActive = navData.navSecondary.map((item) => {
    const isCurrent = pathname === item.url;
    return {
      ...item,
      isActive: isCurrent,
      className: isCurrent ? activeStyles : hoverStyles,
    };
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <BookSearch />
                <span className="text-base font-semibold">UCSTgo Library</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={mainItemsWithActive} />
        {/* //TODO:Delete later */}
        {/* <NavDocuments items={documentItemsWithActive} /> */}
        {/* <NavSecondary items={secondaryItemsWithActive} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
