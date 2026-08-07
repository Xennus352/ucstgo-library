"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "@/lib/auth-client";
import { roleRoutes } from "@/lib/role-routes";
import { User } from "@/types/UserType";
import { LoginFormValues, loginSchema } from "@/lib/validations/auth";
import { toast } from "sonner";
import Image from "next/image";
import { useBrandConfig } from "@/components/brand-config-provider";
import {
  forgotPasswordAction,
  checkPasswordResetStatusAction,
} from "@/app/actions/password-reset";

export default function SignInPage() {
  const router = useRouter();
  const { config: brandConfig } = useBrandConfig();
  const [isLoading, setIsLoading] = useState(false);

  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });
  const [isMobile, setIsMobile] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof LoginFormValues, string>>
  >({});

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showForgotPasswordInput, setShowForgotPasswordInput] = useState(false);
  const [resetStatus, setResetStatus] = useState<{
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[] | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

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

    const validation = loginSchema.safeParse(rawData);

    if (!validation.success) {
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

    const { email, password } = validation.data;

    try {
      const res = await signIn.email({ email, password });

      if (res.error) {
        const message = res.error.message || "Something went wrong.";
        setError(message);
        toast.error(message);
        setIsLoading(false);
        return;
      }

      const userRes = await fetch("/api/me");
      const user: User = await userRes.json();

      if (!user?.role) {
        const message = "User role not found";
        setError(message);
        toast.error(message);
        setIsLoading(false);
        return;
      }

      toast.success(`Welcome back, ${user.name}!`);
      router.push(roleRoutes[user.role]);
    } catch (err) {
      const message = "An unexpected network error occurred.";
      setError(message);
      toast.error(message);
      setIsLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await forgotPasswordAction(forgotEmail, forgotPassword);
      if (res.success) {
        toast.success(res.message || "Reset request submitted successfully!");
        setShowForgotPasswordInput(false);
      } else {
        toast.error(res.error || "Failed to submit reset request");
      }
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleCheckResetStatus() {
    setStatusLoading(true);
    try {
      const res = await checkPasswordResetStatusAction(forgotEmail);
      if (res.success) {
        setResetStatus(res.requests || []);
        toast.success(
          res.requests && res.requests.length > 0
            ? `Found ${res.requests.length} reset request(s)`
            : "No reset requests found for this email",
        );
      } else {
        toast.error(res.error || "Failed to check status");
      }
    } finally {
      setStatusLoading(false);
    }
  }

  const academicItems = ["📚", "📖", "📘", "💻", "📝", "🎓", "📱"];

  // UCS Taungoo Brand Colors Base Mapping
  const ucsBlue = "#0087E1"; // Exact brand shade matching the crest center
  const ucsNavy = "#0B5299"; // Darker institutional blue for high-contrast texts

  return (
    <div className="relative min-h-screen w-full bg-[#F4F9FD] text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden selection:bg-[#0087E1]/20">
      {/* AMBIENT FLOATING BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {academicItems.map((emoji, i) => {
          const mobileLeft =
            i % 2 === 0 ? `${(i * 4) % 15}%` : `${80 + (i % 3) * 5}%`;
          const mobileTop = `${((i * 12) % 85) + 5}%`;
          const desktopLeft = ((i * 199) % (dimensions.width - 100)) + 50;
          const desktopTop = ((i * 277) % (dimensions.height - 100)) + 50;

          return (
            <motion.div
              key={i}
              className="absolute text-2xl md:text-3xl select-none opacity-[0.09] md:opacity-[0.06]"
              style={{
                left: isMobile ? mobileLeft : desktopLeft,
                top: isMobile ? mobileTop : desktopTop,
              }}
              animate={
                isMobile
                  ? { y: [0, -10, 10, 0], scale: [1, 1.02, 0.98, 1] }
                  : { y: [0, -20, 20, 0], rotate: [0, 90, 180, 360] }
              }
              transition={{
                duration: isMobile ? 6 + (i % 2) * 2 : 20 + (i % 3) * 4,
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

      {/* MAIN AUTHENTICATION CARD */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-0 bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xl">
        {/* Left Side: Brand Visual Panel */}
        <div className="relative hidden md:flex lg:col-span-6 p-8 flex-col justify-between items-center text-center border-r border-slate-100 bg-slate-50/20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#E0F2FE] via-white to-[#F0F7FF] z-0" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#0087E1,transparent_75%)] opacity-15 z-0" />

          <div className="relative z-10 my-auto w-full max-w-md rounded-2xl border border-[#0087E1]/15 bg-white/90 backdrop-blur-md shadow-sm overflow-hidden">
            <div className="relative flex flex-col items-center px-8 py-10 text-center">
              {/* Logo Box */}
              <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-white border border-slate-100 shadow-md p-1">
                <Image
                  src={brandConfig.logo}
                  alt={`${brandConfig.name} Logo`}
                  width={84}
                  height={84}
                  className="object-contain"
                  style={{ width: "auto", height: "auto" }}
                  priority
                />
              </div>

              {/* Dynamic Badge matching logo blue */}
              <span className="mb-3 rounded-full bg-[#0087E1]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0B5299] border border-[#0087E1]/20">
                Digital Library
              </span>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B5299]">
                {brandConfig.name}
              </h2>
              <p className="mt-0.5 text-sm font-semibold text-[#0087E1]">
                Management Portal
              </p>

              <p className="mt-4 max-w-xs text-xs leading-5 text-slate-500 font-medium">
                Access your UCS Taungoo academic databases, reference logs,
                e-catalogs, and personalized digital reading workspace.
              </p>

              <div className="my-5 h-px w-20 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-2 w-full text-xs text-slate-600">
                <div className="rounded-lg border border-[#0087E1]/10 bg-[#0087E1]/5 py-2 px-3 font-semibold text-[#0B5299]">
                  📚 E-Books
                </div>
                <div className="rounded-lg border border-[#0087E1]/10 bg-[#0087E1]/5 py-2 px-3 font-semibold text-[#0B5299]">
                  📖 Catalog
                </div>
                <div className="rounded-lg border border-[#0087E1]/10 bg-[#0087E1]/5 py-2 px-3 font-semibold text-[#0B5299]">
                  🔖 Reservations
                </div>
                <div className="rounded-lg border border-[#0087E1]/10 bg-[#0087E1]/5 py-2 px-3 font-semibold text-[#0B5299]">
                  🎓 Research
                </div>
              </div>
            </div>
          </div>

          <p className="relative z-10 text-[10px] text-slate-400 font-bold tracking-widest uppercase">
            Integrated Library System (ILS)
          </p>
        </div>

        {/* Right Side: Sign-In / Forgot Password Panel */}
        <div className="col-span-1 lg:col-span-6 flex flex-col justify-center p-8 sm:p-12 bg-white">
          <div className="w-full max-w-sm mx-auto min-h-[380px] flex flex-col justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              {!showForgotPassword ? (
                /* LOGIN FORM PANEL */
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: -25 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -25 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="space-y-6"
                >
                  <div className="space-y-1.5">
                    <div className="md:hidden flex justify-center mb-3">
                      <span className="text-[11px] uppercase tracking-wider bg-[#0087E1]/10 text-[#0B5299] px-3 py-0.5 rounded-full border border-[#0087E1]/20 font-bold">
                        Library Catalog
                      </span>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0B5299]">
                      Sign In
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                      Enter your institutional account credentials to access
                      your dashboard.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 font-medium">
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

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                    noValidate
                  >
                    <div className="space-y-1">
                      <label
                        className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                        htmlFor="email"
                      >
                        University Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="name@ucstg.edu.mm"
                        disabled={isLoading}
                        style={
                          { "--tw-ring-color": ucsBlue } as React.CSSProperties
                        }
                        className={`w-full rounded-lg bg-white border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0087E1]/20 transition-all disabled:opacity-50 ${
                          fieldErrors.email
                            ? "border-destructive"
                            : "border-slate-200 focus:border-[#0087E1]"
                        }`}
                      />
                      {fieldErrors.email && (
                        <p className="text-xs text-destructive font-medium mt-0.5">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label
                        className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
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
                        style={
                          { "--tw-ring-color": ucsBlue } as React.CSSProperties
                        }
                        className={`w-full rounded-lg bg-white border px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0087E1]/20 transition-all disabled:opacity-50 ${
                          fieldErrors.password
                            ? "border-destructive"
                            : "border-slate-200 focus:border-[#0087E1]"
                        }`}
                      />
                      {fieldErrors.password && (
                        <p className="text-xs text-destructive font-medium mt-0.5">
                          {fieldErrors.password}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      style={{ backgroundColor: ucsBlue }}
                      className="w-full mt-2 text-white font-bold text-sm rounded-lg px-4 py-2.5 hover:opacity-90 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0087E1] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm"
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

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-xs font-semibold text-[#0087E1] hover:text-[#0B5299] hover:underline transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                /* RESET PASSWORD PANEL */
                <motion.div
                  key="reset-password-form"
                  initial={{ opacity: 0, x: 25 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 25 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="space-y-5"
                >
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-[#0B5299]">
                      Reset Password
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Enter your email and desired new password. An admin will
                      review your request.
                    </p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-3.5">
                    <div className="space-y-1">
                      <label
                        className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                        htmlFor="fp-email"
                      >
                        Email Address
                      </label>
                      <input
                        id="fp-email"
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@ucstg.edu.mm"
                        disabled={forgotLoading}
                        style={
                          { "--tw-ring-color": ucsBlue } as React.CSSProperties
                        }
                        className="w-full rounded-lg bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0087E1]/20 focus:border-[#0087E1] transition-all disabled:opacity-50"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        className="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                        htmlFor="fp-password"
                      >
                        New Password
                      </label>
                      <input
                        id="fp-password"
                        type={showForgotPasswordInput ? "text" : "password"}
                        value={forgotPassword}
                        onChange={(e) => setForgotPassword(e.target.value)}
                        placeholder="••••••••"
                        disabled={forgotLoading}
                        style={
                          { "--tw-ring-color": ucsBlue } as React.CSSProperties
                        }
                        className="w-full rounded-lg bg-white border border-slate-200 px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0087E1]/20 focus:border-[#0087E1] transition-all disabled:opacity-50"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="show-pass"
                        type="checkbox"
                        checked={showForgotPasswordInput}
                        onChange={(e) =>
                          setShowForgotPasswordInput(e.target.checked)
                        }
                        className="rounded border-slate-300 text-[#0087E1] focus:ring-[#0087E1]"
                      />
                      <label
                        htmlFor="show-pass"
                        className="text-xs text-slate-500 font-medium cursor-pointer select-none"
                      >
                        Show password
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={forgotLoading}
                      style={{ backgroundColor: ucsBlue }}
                      className="w-full mt-1 text-white font-bold text-sm rounded-lg px-4 py-2.5 hover:opacity-90 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0087E1] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {forgotLoading ? (
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
                          <span>Requesting Reset...</span>
                        </>
                      ) : (
                        <span>Request Reset</span>
                      )}
                    </button>
                  </form>

                  <div className="border-t border-slate-100 pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleCheckResetStatus}
                        disabled={statusLoading || !forgotEmail}
                        className="text-xs font-semibold text-[#0087E1] hover:text-[#0B5299] hover:underline transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {statusLoading ? "Checking..." : "Check Reset Status"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline transition-colors cursor-pointer"
                      >
                        Back to Sign In
                      </button>
                    </div>

                    {resetStatus && (
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                        {resetStatus.length === 0 ? (
                          <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                            🔍 No password reset requests found for this email.
                          </div>
                        ) : (
                          resetStatus.map((req) => (
                            <div
                              key={req.id}
                              className="text-xs bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-0.5"
                            >
                              <p className="font-semibold">
                                {req.status === "COMPLETED" && "✅ "}
                                {req.status === "PENDING" && "⏳ "}
                                {req.status === "REJECTED" && "❌ "}
                                {req.status}
                              </p>
                              <p className="text-slate-500">
                                Requested: {new Date(req.createdAt).toLocaleString()}
                              </p>
                              <p className="text-slate-500">
                                Updated: {new Date(req.updatedAt).toLocaleString()}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
