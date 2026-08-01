"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TabId } from "../types";

type NavItem = {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavProps = {
  tabs: NavItem[];
  activeTab: TabId;
  onTabChange: (id: TabId) => void;
};

// Custom hook to ensure component unmounts entirely on desktop viewports
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return isMobile;
}

const BottomNav: React.FC<NavProps> = ({ tabs, activeTab, onTabChange }) => {
  const isMobile = useIsMobile();

  // CRITICAL: If not on mobile, return null to completely wipe out layoutId contexts
  // from the DOM tree. This stops the layout-animation bug completely.
  if (!isMobile) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
      style={{
        maskImage:
          "linear-gradient(to top, black 82%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to top, black 82%, transparent 100%)",
      }}
    >
      <div className="relative max-w-md mx-auto pointer-events-auto">
        {/* Glass bar */}
        <div className="relative h-16 rounded-2xl bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl border border-slate-200/70 dark:border-slate-700/50 shadow-[0_12px_40px_-8px_rgba(2,6,23,0.18),0_2px_8px_-2px_rgba(2,6,23,0.06)]">
          {/* Top hairline glass highlight */}
          <div className="absolute inset-x-3 top-0 h-px bg-linear-to-r from-transparent via-white/70 dark:via-white/15 to-transparent" />

          {/* Navigation Grid */}
          <div className="relative h-full grid grid-cols-4 items-center">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  aria-current={isActive ? "page" : undefined}
                  className="relative flex flex-col items-center justify-center h-full w-full min-w-0 outline-none cursor-pointer overflow-hidden px-0.5"
                >
                  {/* Sliding active pill */}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-pill"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 34,
                        mass: 0.9,
                      }}
                      className="absolute inset-x-4 inset-y-2.5 rounded-xl bg-sky-500/10 dark:bg-sky-400/10 border border-sky-500/15 dark:border-sky-400/15"
                    />
                  )}

                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <motion.div
                      animate={{
                        scale: isActive ? 1.08 : 1,
                        opacity: isActive ? 1 : 0.55,
                      }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <Icon
                        className={`h-5 w-5 transition-colors duration-300 ${
                          isActive
                            ? "text-sky-600 dark:text-sky-400"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      />
                    </motion.div>
                    <motion.span
                      animate={{
                        opacity: isActive ? 1 : 0.65,
                      }}
                      transition={{ duration: 0.2 }}
                      className={`truncate max-w-full whitespace-nowrap text-[10px] font-medium tracking-wide ${
                        isActive
                          ? "text-sky-700 dark:text-sky-300 font-semibold"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {tab.label}
                    </motion.span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
