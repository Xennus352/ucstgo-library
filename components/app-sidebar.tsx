"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";

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
  DatabaseIcon,
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

  // Define navigation data
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
        url: "#",
        icon: <BookOpenIcon />,
        items: [
          { title: "Books Inventory", url: "/admin/books" },

          { title: "Borrowing", url: "/admin/borrowing" },
          { title: "Reservations", url: "/admin/reservations" },
        ],
      },
      {
        title: "Digital Library",
        url: "#",
        icon: <DatabaseIcon />,
        items: [{ title: "Ebooks", url: "/admin/ebooks" }],
      },
    ],
  };

  // Create user data
  const userData = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,

        image: user.image ?? "/images/avatar.png",

        role: user.role,
        studentId: user.studentId ?? "N/A",
        faculty: user.faculty ?? "N/A",
        phone: user.phone ?? "N/A",

        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        emailVerified: user.emailVerified,
        banned: user.banned,
      }
    : {
        id: "",
        name: isLoading ? "Loading..." : "Error loading user",
        email: isLoading ? "Please wait..." : "Failed to load details",

        image: "/images/avatar.png",

        role: "PENDING",
        studentId: "N/A",
        faculty: "N/A",
        phone: "N/A",

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: null,
        banned: false,
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
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
