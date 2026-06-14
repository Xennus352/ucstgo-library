"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavItem } from "@/types/NavItemType";

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu className="gap-2">
          {items.map((item) => {
            const hasChildren = !!item.items?.length;

            const isParentActive =
              pathname === item.url ||
              item.items?.some((sub) => pathname.startsWith(sub.url));

            // =========================
            // SIMPLE ITEM (NO CHILDREN)
            // =========================
            if (!hasChildren) {
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className={`
                      relative flex items-center gap-3
                      rounded-xl px-4 py-3
                      transition-all duration-300
                      hover:scale-[1.02] hover:bg-primary/10
                      active:scale-[0.98]
                      ${
                        pathname === item.url
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground"
                      }
                      ${item.className ?? ""}
                    `}
                  >
                    <Link href={item.url}>
                      {pathname === item.url && (
                        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white" />
                      )}

                      <span className="transition-transform duration-300">
                        {item.icon}
                      </span>

                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }

            // =========================
            // COLLAPSIBLE ITEM (WITH CHILDREN)
            // =========================
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isParentActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  {/* Parent */}
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={`
                        relative flex items-center gap-3
                        rounded-xl px-4 py-3
                        transition-all duration-300 ease-out
                        hover:scale-[1.02] hover:bg-primary/10
                        active:scale-[0.98]
                        ${
                          isParentActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground"
                        }
                        ${item.className ?? ""}
                      `}
                    >
                      {isParentActive && (
                        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-white" />
                      )}

                      <span className="transition-transform duration-300">
                        {item.icon}
                      </span>

                      <span className="font-medium">{item.title}</span>

                      <ChevronRight
                        className="
                          ml-auto size-4
                          transition-transform duration-300
                          group-data-[state=open]/collapsible:rotate-90
                        "
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  {/* Children */}
                  <CollapsibleContent
                    className="
                      overflow-hidden
                      data-[state=closed]:animate-accordion-up
                      data-[state=open]:animate-accordion-down
                    "
                  >
                    <SidebarMenuSub className="ml-4 mt-2 border-l border-border pl-3">
                      {item.items?.map((subItem) => {
                        const isSubActive =
                          pathname === subItem.url ||
                          pathname.startsWith(`${subItem.url}/`);

                        return (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={`
                                group flex items-center gap-2
                                rounded-lg px-3 py-2
                                transition-all duration-300
                                hover:translate-x-1 hover:bg-primary/10
                                ${
                                  isSubActive
                                    ? "bg-primary/15 text-primary font-medium"
                                    : "text-muted-foreground"
                                }
                              `}
                            >
                              <Link href={subItem.url}>
                                <span
                                  className={`
                                    h-2 w-2 rounded-full transition-all duration-300
                                    ${
                                      isSubActive
                                        ? "bg-primary scale-125"
                                        : "bg-muted-foreground/40 group-hover:bg-primary"
                                    }
                                  `}
                                />

                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
