"use client";

import React from "react";
import { motion } from "framer-motion";

import { SearchBar } from "../ui/SearchBar";
import { TabConfig, TabId } from "../types";
import Image from "next/image";
import NotificationBell from "@/components/NotificationBell";
import { brandConfig } from "@/config/brand";

interface TopNavProps {
  tabs: TabConfig[];
  activeTab: TabId;
  onTabChange: (tabId: TabId) => void;
  onSearch?: (query: string) => void;
  isLoggedIn?: boolean;
  searchValue?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  onSearch,
  isLoggedIn = false,
  searchValue = "",
}) => {
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 sm:px-6 py-2.5 border-b border-border/40"
    >
      {/* CHANGED: Changed flex-col to md:flex-row to handle tablet sizes gracefully */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
        {/* TOP ROW: LOGO, TABS, & MOBILE UTILITIES */}
        <div className="flex items-center justify-between gap-4 w-full md:w-auto">
          {/* BRAND */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <div className="relative h-9 w-9 overflow-hidden flex items-center justify-center">
              <Image
                src={brandConfig.logo}
                alt={`${brandConfig.name} Logo`}
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg text-primary font-bold tracking-tight">
              {brandConfig.name}
            </span>
          </motion.div>

          <nav className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as TabId)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 outline-none select-none cursor-pointer ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>{" "}
                  {/* Optional: Hide text on tiny screens, show on small/tablet */}
                  {isActive && (
                    <motion.div
                      layoutId="active-desktop-tab-underline"
                      className="absolute bottom-0 left-3 right-3 h-[2px] bg-primary rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* MOBILE NOTIFICATION BELL (Hidden on md and up) */}
          {isLoggedIn && (
            <div className="block md:hidden shrink-0">
              <NotificationBell />
            </div>
          )}
        </div>

        {/* BOTTOM ROW / RIGHT ROW */}
        <div className="flex items-center gap-4 w-full md:w-auto md:max-w-md md:justify-end flex-1">
          {/* SEARCH BAR */}
          <SearchBar
            value={searchValue}
            onChange={onSearch}
            className="w-full md:w-[220px] lg:w-[260px] xl:w-[300px]"
          />

          {/* DESKTOP/TABLET NOTIFICATION BELL */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center shrink-0 border-l border-border/60 pl-4 h-5">
              <NotificationBell />
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};
