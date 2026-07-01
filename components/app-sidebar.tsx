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
import { BookSearch } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { brandConfig } from "@/config/brand";

// Match the exact shape of your navData object
interface NavSubItem {
  title: string;
  url: string;
}

interface NavItem {
  title: string;
  url: string;
  icon: React.ReactNode;
  items?: NavSubItem[];
}

interface DynamicSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navData: {
    navMain: NavItem[];
  };
}

export function AppSidebar({ navData, ...props }: DynamicSidebarProps) {
  const { user, isLoading, error } = useCurrentUser();
  const pathname = usePathname();

  // Create user data
  const userData = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image ?? "/images/avatar.png",
        role: user.role, // This correctly maps to the Role enum
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

        //  Cast the string to the Role enum, or set to your default STUDENT role
        role: "STUDENT" as const,

        studentId: "N/A",
        faculty: "N/A",
        phone: "N/A",

        // Pass an actual Date object instead of a string
        createdAt: new Date(),
        updatedAt: new Date(),

        // Pass a boolean (false) instead of null
        emailVerified: false,
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
                <Image
                  src={brandConfig.logo}
                  alt={`${brandConfig.name} Logo`}
                  width={36}
                  height={36}
                  className="object-contain"
                  priority
                />
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
