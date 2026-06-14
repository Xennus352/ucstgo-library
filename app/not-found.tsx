"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import TextToSVGComponent from "@/components/animations/TextToSvg";

const emojis = ["📚", "📖", "📘", "🧭", "🔍", "📡", "💻", "🎓", "❓"];

export default function NotFoundPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background text-foreground overflow-hidden px-6">

      {/* SOFT BACKGROUND GLOW */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-secondary/10" />

      {/* FLOATING ICONS */}
      <div className="absolute inset-0 pointer-events-none">
        {emojis.map((e, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl md:text-4xl opacity-10 md:opacity-20"
            style={{
              left: `${(i * 15) % 100}%`,
              top: `${(i * 13) % 100}%`,
            }}
            animate={{
              y: [0, -20, 20, 0],
              rotate: [0, 180, 360],
              scale: [1, 1.05, 0.95, 1],
            }}
            transition={{
              duration: 12 + i,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {e}
          </motion.div>
        ))}
      </div>

      {/* MAIN LAYOUT */}
      <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">

        {/* LEFT HERO (DESKTOP ONLY) */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:flex flex-col space-y-6"
        >

          {/* 🔥 YOUR TEXT SVG COMPONENT */}
          <div className="relative">
            <div className="absolute inset-0 blur-3xl bg-primary/20 scale-110 rounded-full" />
            <div className="relative">
              <TextToSVGComponent />
            </div>
          </div>

          <h1 className="text-3xl font-black">
            Page Not Found
          </h1>

          <p className="text-muted-foreground max-w-md leading-relaxed">
            The page you are looking for does not exist in the University Library System.
            It may have been moved, renamed, or removed.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-semibold">
            🔍 SEARCH TARGET NOT FOUND
          </div>
        </motion.div>

        {/* RIGHT CARD */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative bg-card border border-border rounded-3xl shadow-xl p-6 sm:p-10 text-center backdrop-blur-xl"
        >

          {/* MOBILE SVG (important fallback) */}
          <div className="lg:hidden mb-6">
            <TextToSVGComponent />
          </div>

          {/* BIG 404 (mobile emphasis) */}
          <div className="lg:hidden mb-4 text-7xl font-black text-primary">
            404
          </div>

          <h2 className="text-2xl font-bold text-foreground">
            Lost in the Library System
          </h2>

          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            We couldn’t find the page you were looking for.
            Try checking the URL or return to the main system dashboard.
          </p>

          {/* STATUS */}
          <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-semibold">
            🧭 NAVIGATION ERROR
          </div>

          {/* ACTIONS */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition font-semibold"
            >
              Go Back
            </button>

            <button
              onClick={() => router.push("/")}
              className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted/30 transition font-semibold"
            >
              Return Home
            </button>
          </div>

          {/* FOOTNOTE */}
          <p className="mt-8 text-[11px] text-muted-foreground">
            University Library Network • Route Resolver System
          </p>

          {/* SOFT RING */}
          <div className="absolute inset-0 rounded-3xl ring-1 ring-primary/10 pointer-events-none" />
        </motion.div>
      </div>
    </main>
  );
}