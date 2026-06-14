"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";

const emojis = ["💥", "⚠️", "📡", "🔥", "💻", "🔧", "📉"];

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("SYSTEM FAILURE:", error);
  }, [error]);

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background text-foreground overflow-hidden px-6">
      {/* SYSTEM FAILURE GLOW FIELD */}
      <div className="absolute inset-0 bg-linear-to-br from-orange-500/10 via-red-500/10 to-transparent animate-pulse" />

      {/* FLOATING “BROKEN SYSTEM” ICONS */}
      <div className="absolute inset-0 pointer-events-none">
        {emojis.map((e, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl md:text-5xl opacity-15"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 13) % 100}%`,
            }}
            animate={{
              y: [0, -40, 40, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.15, 0.9, 1],
            }}
            transition={{
              duration: 10 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {e}
          </motion.div>
        ))}
      </div>

      {/* MAIN DASHBOARD */}
      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">
        {/* LEFT - SYSTEM DIAGNOSTIC PANEL */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-col space-y-6"
        >
          {/* BIG STATUS CODE */}
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-orange-500/20 scale-110 rounded-full" />
            <div className="text-[120px] font-black text-orange-500 leading-none">
              500
            </div>
          </div>

          <div className="text-sm font-bold tracking-widest text-orange-500">
            ⚠ CRITICAL SYSTEM FAILURE
          </div>

          <h1 className="text-3xl font-black">Library Backend Unstable</h1>

          <p className="text-muted-foreground max-w-md leading-relaxed">
            The University Library System has encountered an internal server
            error. Database or service components may be temporarily
            unavailable.
          </p>

          {/* STATUS CHIP */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 text-sm font-semibold">
            🔧 RECOVERY MODE ACTIVE
          </div>
        </motion.div>

        {/* RIGHT - CONTROL PANEL */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative bg-card border border-orange-500/20 rounded-3xl shadow-2xl p-6 sm:p-10 text-center backdrop-blur-xl"
        >
          {/* MOBILE 500 */}
          <div className="lg:hidden mb-4 text-7xl font-black text-orange-500">
            500
          </div>

          {/* HEADER */}
          <div className="text-xs font-bold tracking-[0.3em] text-orange-500 mb-2">
            SYSTEM CRASH
          </div>

          <h2 className="text-2xl font-black">Service Temporarily Down</h2>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            We are currently experiencing internal system instability. Please
            try again in a moment.
          </p>

          {/* ALERT BADGE */}
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs font-semibold">
            ⚠ DATABASE INTERRUPTION
          </div>

          {/* ERROR ID */}
          {error?.digest && (
            <p className="mt-4 text-[11px] text-muted-foreground">
              ERROR ID: {error.digest}
            </p>
          )}

          {/* ACTIONS */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => reset()}
              className="px-5 py-2.5 rounded-xl bg-orange-500 text-white hover:scale-[1.02] active:scale-95 transition font-semibold shadow-md"
            >
              Retry System
            </button>

            <button
              onClick={() => (window.location.href = "/")}
              className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted/30 transition font-semibold"
            >
              Return Home
            </button>
          </div>

          {/* FOOTER */}
          <p className="mt-8 text-[11px] text-muted-foreground">
            SYSTEM LOG • UNIVERSITY LIBRARY NETWORK
          </p>

          {/* RING GLOW */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-orange-500/10 pointer-events-none" />
        </motion.div>
      </div>
    </main>
  );
}
