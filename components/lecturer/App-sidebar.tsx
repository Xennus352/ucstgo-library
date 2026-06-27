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
  const { user, isLoading } = useCurrentUser();

  // Create user data safely
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
        role: "STUDENT" as const,
        studentId: "N/A",
        faculty: "N/A",
        phone: "N/A",
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: false,
        banned: false,
      };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/lecturer/home">
                <BookSearch />
                <span className="text-base font-semibold">UCSTgo Library</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Pass raw items directly. Let NavMain evaluate active states on runtime */}
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
