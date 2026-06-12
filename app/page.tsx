"use client";

import { motion } from "framer-motion";
import SplashScreen from "@/components/animations/Splash";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import LoginDialog from "@/components/LoginDialog";

export default function Home() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setIsMobile(window.innerWidth < 768);
    };

    // Initialize dimensions on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    const t = setTimeout(() => setShowSplash(false), 3000);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(t);
    };
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  // Define unique responsive motion behaviors
  const items = [
    "📚",
    "📖",
    "📘",
    "💻",
    "📝",
    "🎓",
    "📚",
    "📖",
    "📘",
    "📱",
    "📝",
    "🎓",
  ];

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-transparent text-slate-900 selection:bg-blue-500/20 px-4 overflow-hidden">
      {/*  RESPONSIVE FLOATING MEDIA ELEMENTS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {items.map((emoji, i) => {
          // MOBILE BEHAVIOR: Securely fixed near edges to completely clear the center app card
          const mobileLeft =
            i % 2 === 0 ? `${(i * 3) % 12}%` : `${85 + (i % 3) * 4}%`;
          const mobileTop = `${((i * 8) % 90) + 5}%`;

          // DESKTOP BEHAVIOR: Dynamic spread math
          const desktopLeft = Math.random() * (dimensions.width - 120);
          const desktopTop = Math.random() * (dimensions.height - 120);

          return (
            <motion.div
              key={i}
              className="absolute text-2xl md:text-4xl select-none opacity-[0.3] md:opacity-[0.12]"
              style={{
                left: isMobile ? mobileLeft : desktopLeft,
                top: isMobile ? mobileTop : desktopTop,
              }}
              animate={
                isMobile
                  ? {
                      y: [0, -12, 12, 0],
                      scale: [1, 1.05, 0.95, 1],
                    }
                  : {
                      y: [null, -35, 35, -35],
                      rotate: [0, 180, 360],
                    }
              }
              transition={{
                duration: isMobile ? 6 + (i % 4) * 2 : 14 + (i % 5) * 3,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
              }}
            >
              {emoji}
            </motion.div>
          );
        })}
      </div>

      {/* COMPACT PORTAL CARD */}
      <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center">
        {/* Institutional Identifier */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-xs sm:text-sm font-bold text-blue-700 shadow-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          University Library Network
        </motion.div>

        {/* Core Header Content */}
        <section className="text-center w-full flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.2] mb-4"
          >
            Library <span className="text-blue-600">Management System</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 max-w-xl font-medium leading-relaxed px-2"
          >
            Secure gateway for terminal lookups, active book reservations, and
            digital resource archives.
          </motion.p>

          {/* --- DIRECT INTERACTION HUB --- */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 md:mt-10 p-6 sm:p-10 w-full bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl shadow-xl shadow-slate-200/40 flex flex-col items-center gap-6"
          >
            <div className="w-full max-w-md text-center">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                Authorized Entry Only
              </h2>
              <p className="text-xs text-slate-500">
                Please authenticate using your assigned university credentials.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3.5 w-full max-w-md">
              <LoginDialog />
            </div>
          </motion.div>

          {/* --- CONCISE UTILITY SUMMARY --- */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-3 gap-2 sm:gap-6 mt-8 md:mt-10 w-full max-w-xl"
          >
            {[
              { title: "E-Books Online", value: "80K+" },
              { title: "Physical Volumes", value: "15K+" },
              { title: "Active Tech Users", value: "8K+" },
            ].map((metric, idx) => (
              <div
                key={idx}
                className="bg-slate-50/70 border border-slate-100 p-2.5 sm:p-4 rounded-xl text-center"
              >
                <div className="text-base sm:text-xl font-black text-slate-800">
                  {metric.value}
                </div>
                <div className="text-[9px] sm:text-xs font-semibold text-slate-500 mt-0.5 uppercase tracking-wider">
                  {metric.title}
                </div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* Minimalist Portal Footnote */}
        <footer className="mt-12 text-[11px] font-medium text-slate-400 tracking-wide">
          © {new Date().getFullYear()} University Library Dept. All Rights
          Reserved.
        </footer>
      </div>
    </main>
  );
}
