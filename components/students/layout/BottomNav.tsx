"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavProps } from "@/app/student/dashboard/page";

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
  // from the DOM tree. This stops the multi-bubble bug completely.
  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pointer-events-none">
      <div className="relative max-w-md mx-auto pointer-events-auto">
        {/* Dock Background with shimmer effect */}
        <motion.div
          className="
            absolute inset-0
            h-16
            bg-white/95
            backdrop-blur-xl
            border border-slate-200/50
            rounded-3xl
            shadow-[0_8px_30px_rgba(0,0,0,0.08)]
          "
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Animated gradient border */}
          <motion.div
            className="absolute inset-0 rounded-3xl bg-linear-to-r from-sky-400/20 via-cyan-400/20 to-sky-400/20 opacity-0"
            animate={{
              opacity: activeTab ? 0.3 : 0,
              background: [
                "linear-gradient(90deg, rgba(14,165,233,0) 0%, rgba(14,165,233,0.3) 50%, rgba(14,165,233,0) 100%)",
                "linear-gradient(270deg, rgba(14,165,233,0) 0%, rgba(14,165,233,0.3) 50%, rgba(14,165,233,0) 100%)",
              ],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </motion.div>

        {/* Navigation Grid */}
        <div className="relative h-16 grid grid-cols-4 items-center">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="
                  relative
                  flex
                  flex-col
                  items-center
                  justify-end
                  h-full
                  w-full
                  pb-2.5
                  outline-none
                  cursor-pointer
                "
              >
                {/* 1. ICON TRACK & BUBBLE ZONE */}
                <div className="absolute top-0 inset-x-0 bottom-6 flex items-center justify-center">
                  {/* Sliding Active Bubble Layer Restored */}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-bubble-mobile"
                      transition={{
                        type: "spring",
                        stiffness: 430,
                        damping: 28,
                        mass: 0.9,
                      }}
                      className="
                        absolute
                        -top-5
                        w-14
                        h-14
                        rounded-full
                        bg-linear-to-r
                        from-sky-500
                        to-cyan-500
                        shadow-[0_10px_25px_rgba(14,165,233,0.35)]
                        z-0
                      "
                    >
                      {/* Inner Ring Glow */}
                      <motion.div
                        className="absolute inset-1 rounded-full bg-white/10"
                        animate={{
                          scale: [1, 1.05, 1],
                          opacity: [0.3, 0.5, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </motion.div>
                  )}

                  {/* Interactive Icon Component */}
                  <motion.div
                    animate={{
                      y: isActive ? -20 : 0,
                      scale: isActive ? 1.15 : 1,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 25,
                      mass: 0.8,
                    }}
                    className="relative z-10 flex items-center justify-center w-6 h-6"
                  >
                    <motion.div
                      animate={{
                        rotate: isActive ? [0, -6, 6, -6, 0] : 0,
                      }}
                      transition={{
                        duration: 0.4,
                        ease: "easeInOut",
                      }}
                    >
                      <Icon
                        className={`h-5 w-5 transition-colors duration-300 ${
                          isActive
                            ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                            : "text-slate-400"
                        }`}
                      />
                    </motion.div>
                  </motion.div>
                </div>

                {/* 2. LABEL TRACK */}
                <div className="relative z-10 h-3 flex items-center justify-center">
                  <motion.span
                    animate={{
                      scale: isActive ? 1.02 : 0.98,
                      opacity: isActive ? 1 : 0.7,
                    }}
                    transition={{ duration: 0.15 }}
                    className={`
                      text-[10px]
                      font-medium
                      tracking-wide
                      transition-colors
                      duration-300
                      ${isActive ? "text-sky-600 font-bold" : "text-slate-500"}
                    `}
                  >
                    {tab.label}
                  </motion.span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Top decorative accent line */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-20 h-1 bg-linear-to-r from-sky-400/0 via-sky-400/20 to-sky-400/0 rounded-full" />
      </div>
    </div>
  );
};

export default BottomNav;
