"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lock, ArrowLeft, MessageSquare, Home } from "lucide-react";
import Link from "next/link";

// Security-themed floating icons
const emojis = ["🔒", "🚫", "🛡️", "👁️", "🚨", "🔑", "⛔"];

export default function BlockedPage() {
  // FIX: Generate the ID on client-side only using useState and useEffect
  const [attemptId, setAttemptId] = useState<string>("...");

  useEffect(() => {
    setAttemptId(Math.random().toString(36).substr(2, 9).toUpperCase());
  }, []);

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background text-foreground overflow-hidden px-6">
      {/* SECURITY ALERT GLOW FIELD */}
      {/* FIX: Corrected typo from bg-linear to bg-gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-destructive/10 to-transparent animate-pulse" />

      {/* FLOATING “SECURITY” ICONS */}
      <div className="absolute inset-0 pointer-events-none">
        {emojis.map((e, i) => (
          <motion.div
            key={i}
            className="absolute text-3xl md:text-5xl opacity-15"
            style={{
              left: `${(i * 19) % 100}%`,
              top: `${(i * 11) % 100}%`,
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
        {/* LEFT - DIAGNOSTIC PANEL */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-col space-y-6"
        >
          {/* BIG STATUS CODE */}
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-destructive/20 scale-110 rounded-full" />
            <div className="text-[120px] font-black text-destructive leading-none">
              403
            </div>
          </div>

          <div className="text-sm font-bold tracking-widest text-destructive">
            ⚠ ACCESS RESTRICTED
          </div>

          <h1 className="text-3xl font-black">Authorization Failed</h1>

          <p className="text-muted-foreground max-w-md leading-relaxed">
            Your credentials do not grant access to this resource. This security
            checkpoint requires elevated privileges.
          </p>

          {/* STATUS CHIP */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30 text-destructive text-sm font-semibold">
            🔒 SECURITY CHECKPOINT ACTIVE
          </div>
        </motion.div>

        {/* RIGHT - CONTROL PANEL */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative bg-card border border-destructive/20 rounded-3xl shadow-2xl p-6 sm:p-10 text-center backdrop-blur-xl"
        >
          {/* MOBILE 403 */}
          <div className="lg:hidden mb-4 text-7xl font-black text-destructive">
            403
          </div>

          {/* HEADER */}
          <div className="text-xs font-bold tracking-[0.3em] text-destructive mb-2">
            ACCESS DENIED
          </div>

          <h2 className="text-2xl font-black">Resource Locked</h2>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            You have been restricted from viewing this page due to security
            policies.
          </p>

          {/* ALERT BADGE */}
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold">
            🚫 YOU GOT BANNED
          </div>

          {/* SECURITY LOG FOOTER */}
          <p className="mt-8 text-[11px] text-muted-foreground">
            SECURE LOG • ATTEMPT ID: #{attemptId}
          </p>

          {/* ACTIONS */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="w-full">
              <button className="w-full px-5 py-2.5 rounded-xl bg-destructive text-white hover:scale-[1.02] active:scale-95 transition font-semibold shadow-md shadow-destructive/20">
                Return Home
              </button>
            </Link>
          </div>

          {/* RING GLOW */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-destructive/10 pointer-events-none" />
        </motion.div>
      </div>
    </main>
  );
}
