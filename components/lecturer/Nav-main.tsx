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
            const isExactParentActive = pathname === item.url;
            const isAnyChildActive = !!item.items?.some((sub) => {
              return pathname === sub.url || pathname.startsWith(`${sub.url}/`);
            });
            const isParentActive = isExactParentActive || isAnyChildActive;

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
                      hover:scale-[1.02] hover:bg-primary/5
                      active:scale-[0.98]
                      ${
                        isExactParentActive
                          ? "bg-primary/20 backdrop-blur-sm text-primary font-semibold shadow-lg ring-1 ring-primary/20"
                          : "text-muted-foreground hover:text-foreground"
                      }
                      ${item.className ?? ""}
                    `}
                  >
                    <Link href={item.url}>
                      <span
                        className={`transition-transform duration-300 ${
                          isExactParentActive ? "scale-110" : ""
                        }`}
                      >
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
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={`
                        relative flex items-center gap-3
                        rounded-xl px-4 py-3
                        transition-all duration-300 ease-out
                        hover:scale-[1.02] hover:bg-primary/5
                        active:scale-[0.98]
                        ${
                          isParentActive
                            ? "bg-secondary/60 backdrop-blur-sm text-foreground font-semibold shadow-md ring-1 ring-border"
                            : "text-muted-foreground hover:text-foreground"
                        }
                        ${item.className ?? ""}
                      `}
                    >
                      <span className="transition-transform duration-300">
                        {item.icon}
                      </span>
                      <span className="font-medium">{item.title}</span>
                      <ChevronRight
                        className="
                          ml-auto size-4
                          transition-transform duration-300
                          text-muted-foreground/70
                          group-data-[state=open]/collapsible:rotate-90
                          group-data-[state=open]/collapsible:text-foreground
                        "
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent
                    className="
                      overflow-hidden
                      data-[state=closed]:animate-accordion-up
                      data-[state=open]:animate-accordion-down
                    "
                  >
                    <SidebarMenuSub className="ml-4 mt-1 border-l border-border/60 pl-3 gap-1">
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
                                hover:translate-x-1 hover:bg-primary/5
                                ${
                                  isSubActive
                                    ? "bg-primary/15 backdrop-blur-sm text-primary font-semibold shadow-sm ring-1 ring-primary/10"
                                    : "text-muted-foreground hover:text-foreground"
                                }
                              `}
                            >
                              <Link href={subItem.url}>
                                <span
                                  className={`
                                    h-1.5 w-1.5 rounded-full transition-all duration-300
                                    ${
                                      isSubActive
                                        ? "bg-primary scale-125 shadow-[0_0_8px_rgba(var(--primary),0.5)]"
                                        : "bg-muted-foreground/30 group-hover:bg-muted-foreground/70"
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
