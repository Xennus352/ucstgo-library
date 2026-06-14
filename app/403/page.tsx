"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const emojis = ["📚", "📖", "📘", "💻", "🧠", "🎓", "📡", "🔒", "🚫"];

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background text-foreground overflow-hidden px-6">

      {/* DARK SECURITY OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-primary/10" />

      {/* FLOATING SECURITY ICONS */}
      <div className="absolute inset-0 pointer-events-none">
        {emojis.map((e, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl md:text-4xl opacity-10 md:opacity-15"
            style={{
              left: `${(i * 14) % 100}%`,
              top: `${(i * 17) % 100}%`,
            }}
            animate={{
              y: [0, -25, 25, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.05, 0.95, 1],
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

      {/* MAIN GRID */}
      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">

        {/* LEFT - SECURITY STATUS PANEL */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-col items-start space-y-6"
        >

          {/* HUGE 403 SIGNAL */}
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-red-500/20 scale-110 rounded-full" />
            <div className="text-[120px] font-black text-red-500 tracking-tight leading-none">
              403
            </div>
          </div>

          {/* SYSTEM STATUS */}
          <div className="text-sm font-semibold tracking-widest text-red-500">
            ⚠ SECURITY BREACH DETECTED
          </div>

          <h1 className="text-3xl font-black">
            Access Denied by System Policy
          </h1>

          <p className="text-muted-foreground max-w-md leading-relaxed">
            This area is protected under University Library Security Protocol.
            Your credentials do not grant access to this resource layer.
          </p>

          <div className="px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-semibold">
            🔐 AUTHORIZATION REQUIRED
          </div>
        </motion.div>

        {/* RIGHT - DENIAL TERMINAL CARD */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative bg-card border border-red-500/20 rounded-3xl shadow-2xl p-6 sm:p-10 text-center backdrop-blur-xl"
        >

          {/* MOBILE 403 */}
          <div className="lg:hidden mb-6">
            <div className="text-7xl font-black text-red-500">403</div>
          </div>

          {/* HEADER TAG */}
          <div className="text-xs font-bold tracking-[0.3em] text-red-500 mb-2">
            ACCESS BLOCKED
          </div>

          <h2 className="text-2xl font-black text-foreground">
            Forbidden Access Zone
          </h2>

          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            You do not have permission to access this protected section of the
            University Library System.
          </p>

          {/* STATUS WARNING */}
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold">
            🚫 SYSTEM ACCESS DENIED
          </div>

          {/* ACTIONS */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl bg-red-500 text-white hover:opacity-90 transition font-semibold"
            >
              Go Back
            </button>

            <button
              onClick={() => router.push("/")}
              className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted/40 transition font-semibold"
            >
              Return Home
            </button>
          </div>

          {/* FOOTER */}
          <p className="mt-8 text-[11px] text-muted-foreground">
            SECURITY LOG • UNIVERSITY LIBRARY SYSTEM
          </p>

          {/* RED PULSE BORDER */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-red-500/10 pointer-events-none" />
        </motion.div>
      </div>
    </main>
  );
}