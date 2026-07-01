"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signIn } from "@/lib/auth-client";
import { roleRoutes } from "@/lib/role-routes";
import { User } from "@/types/UserType";
import { LoginFormValues, loginSchema } from "@/lib/validations/auth";
import TextToSvgComponent from "@/components/animations/TextToSvg";
import Image from "next/image";
import { brandConfig } from "@/config/brand";

export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Ambient background animation state values
  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [isMobile, setIsMobile] = useState(false);

  // State for global server/auth errors
  const [error, setError] = useState<string | null>(null);
  // State for specific field validation errors (email, password)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginFormValues, string>>
  >({});

  // Monitor window scaling to prevent layout snapping during animations
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const rawData = Object.fromEntries(formData.entries());

    // 1. Validate data using your Zod Schema client-side
    const validation = loginSchema.safeParse(rawData);

    if (!validation.success) {
      // Format and map errors to their respective fields
      const formattedErrors: Partial<Record<keyof LoginFormValues, string>> =
        {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof LoginFormValues;
        formattedErrors[path] = issue.message;
      });

      setFieldErrors(formattedErrors);
      setIsLoading(false);
      return;
    }

    // 2. Extracted safe data from Zod (properly trimmed and lowercase)
    const { email, password } = validation.data;

    try {
      const res = await signIn.email({ email, password });

      if (res.error) {
        setError(res.error.message || "Something went wrong.");
        setIsLoading(false);
        return;
      }

      // Fetch real user from DB
      const userRes = await fetch("/api/me");
      const user: User = await userRes.json();

      if (!user?.role) {
        setError("User role not found");
        setIsLoading(false);
        return;
      }

      // Redirect based on library role
      router.push(roleRoutes[user.role]);
    } catch (err) {
      setError("An unexpected network error occurred.");
      setIsLoading(false);
    }
  }

  // Academic theme background assets
  const academicItems = [
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
    <div className="relative min-h-screen w-full bg-background text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden selection:bg-primary/20">
      {/* =========================================================================
          AMBIENT FLOATING MEDIA BACKGROUND LAYER
         ========================================================================= */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {academicItems.map((emoji, i) => {
          // MOBILE BEHAVIOR: Clean layouts pinned to outer viewport bounds
          const mobileLeft =
            i % 2 === 0 ? `${(i * 3) % 12}%` : `${85 + (i % 3) * 4}%`;
          const mobileTop = `${((i * 8) % 90) + 5}%`;

          // DESKTOP BEHAVIOR: Dynamic distribution map
          const desktopLeft = ((i * 149) % (dimensions.width - 100)) + 30;
          const desktopTop = ((i * 227) % (dimensions.height - 100)) + 30;

          return (
            <motion.div
              key={i}
              className="absolute text-2xl md:text-4xl select-none opacity-[0.25] md:opacity-[0.12]"
              style={{
                left: isMobile ? mobileLeft : desktopLeft,
                top: isMobile ? mobileTop : desktopTop,
              }}
              animate={
                isMobile
                  ? {
                      y: [0, -10, 10, 0],
                      scale: [1, 1.05, 0.95, 1],
                    }
                  : {
                      y: [0, -30, 30, 0],
                      rotate: [0, 180, 360],
                    }
              }
              transition={{
                duration: isMobile ? 5 + (i % 3) * 2 : 15 + (i % 4) * 3,
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

      {/* =========================================================================
          MAIN AUTHENTICATION WORKSPACE
         ========================================================================= */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
        {/* Left Side: Premium Brand Visual Panel (Stripe/Linear Inspired Glass) */}
        <div className="relative hidden md:flex lg:col-span-6 p-8 flex-col justify-between items-center text-center border-b lg:border-b-0 lg:border-r border-border overflow-hidden">
          {/* Base Premium Dark Gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 z-0" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#60A5FA33,transparent_40%),radial-gradient(circle_at_bottom_right,#A855F733,transparent_40%)] z-0" />
          <div className="relative z-10 my-auto w-full max-w-md rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] overflow-hidden">
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-blue-500/10 pointer-events-none" />

            <div className="relative flex flex-col items-center px-10 py-12 text-center">
              {/* Logo */}
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 border border-white/20 shadow-lg">
                <Image
                  src={brandConfig.logo}
                  alt={`${brandConfig.name} Logo`}
                  width={70}
                  height={70}
                  className="object-contain"
                  priority
                />
              </div>

              {/* Badge */}
              <span className="mb-4 rounded-full border border-blue-400/30 bg-blue-500/15 px-4 py-1 text-xs font-medium uppercase tracking-[0.25em] text-blue-200">
                Digital Library
              </span>

              {/* Title */}
              <h2 className="text-3xl font-bold tracking-tight text-white">
                {brandConfig.name}
              </h2>

              <p className="mt-2 text-lg font-medium text-blue-200">Portal</p>

              {/* Description */}
              <p className="mt-6 max-w-sm leading-7 text-slate-300">
                Search academic catalogs, borrow physical books, read digital
                resources, and manage your library account from one place.
              </p>

              {/* Divider */}
              <div className="my-8 h-px w-20 bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />

              {/* Features */}
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  📚 E-Books
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  📖 Catalog
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  🔖 Reservations
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  🎓 Research
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-xs text-slate-400">
            Integrated Library System (ILS)
          </p>
        </div>

        {/* Right Side: Form Content Panel */}
        <div className="col-span-1 lg:col-span-6 flex flex-col justify-center p-6 sm:p-10 md:p-12 bg-card">
          <div className="w-full max-w-md mx-auto space-y-6">
            <div className="space-y-2">
              <div className="md:hidden flex justify-center mb-4">
                <span className="text-xs uppercase tracking-widest bg-royal/10 text-royal px-3 py-1 rounded-full border border-royal/20 font-semibold">
                  University Catalog
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-navy">
                Sign In
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your institutional credentials to access your library
                dashboard.
              </p>
            </div>

            {/* Global Error Banner */}
            {error && (
              <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Authorization Form */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Email Input */}
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  htmlFor="email"
                >
                  University Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="student@university.edu"
                  disabled={isLoading}
                  className={`w-full rounded-lg bg-white border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 transition-all disabled:opacity-50 ${
                    fieldErrors.email
                      ? "border-destructive focus:border-destructive focus:ring-destructive"
                      : "border-border focus:border-royal focus:ring-royal"
                  }`}
                />
                {fieldErrors.email && (
                  <p className="text-xs text-destructive mt-1">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  className={`w-full rounded-lg bg-white border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 transition-all disabled:opacity-50 ${
                    fieldErrors.password
                      ? "border-destructive focus:border-destructive focus:ring-destructive"
                      : "border-border focus:border-royal focus:ring-royal"
                  }`}
                />
                {fieldErrors.password && (
                  <p className="text-xs text-destructive mt-1">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-royal text-white font-semibold text-sm rounded-lg px-4 py-2.5 hover:bg-navy focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-royal transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <span>Sign In to System</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
