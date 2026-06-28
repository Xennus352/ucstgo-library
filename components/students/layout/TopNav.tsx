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
  brandName?: string;
  searchValue?: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  onSearch,
  brandName,
  searchValue = "",
}) => {
  return (
    <motion.header
      initial={{ y: -12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border/40"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* BRAND */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 shrink-0"
        >
          <div className="relative h-10 w-10 overflow-hidden flex items-center justify-center">
            <Image
              src={brandConfig.logo}
              alt={`${brandConfig.name} Logo`}
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          {/* hide text only on very small screens */}
          <span className="text-lg font-bold tracking-tight hidden sm:inline">
            {brandName}
          </span>
        </motion.div>

        {/* DESKTOP NAV WITH SLIDING ANIMATION */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as TabId)}
                className={`relative flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 outline-none select-none cursor-pointer ${
                  isActive
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {/* Sliding Background Pill */}
                {isActive && (
                  <motion.div
                    layoutId="active-desktop-tab-pill"
                    className="absolute inset-0 bg-card rounded-lg shadow-sm border border-border/10 z-0"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}

                {/* Content layers explicitly above the absolute animated background */}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <NotificationBell />
        {/* SEARCH  */}
        <SearchBar
          value={searchValue}
          onChange={onSearch}
          className="sm:flex"
        />
      </div>
    </motion.header>
  );
};
