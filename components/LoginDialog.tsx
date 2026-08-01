"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signIn, signOut } from "@/lib/auth-client";
import { roleRoutes } from "@/lib/role-routes";

import { Role } from "@/types/Role";
import { User } from "@/types/UserType";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "@/lib/validations/auth";
import { useCurrentUser } from "@/hooks/use-current-user";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeClosed, Lock } from "lucide-react";
import { useBrandConfig } from "@/components/brand-config-provider";
import {
  forgotPasswordAction,
  checkPasswordResetStatusAction,
} from "@/app/actions/password-reset";

interface LoginDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  allowRoles?: Role[];
}

export default function LoginDialog({
  isOpen,
  onOpenChange,
  showTrigger = true,
  allowRoles,
}: LoginDialogProps) {
  const router = useRouter();
  const { refreshUser } = useCurrentUser();
  const { config: brandConfig } = useBrandConfig();

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [showForgotPasswordInput, setShowForgotPasswordInput] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState<{
    id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }[] | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleLogin = async (values: LoginFormValues) => {
    if (loading) return;

    try {
      setLoading(true);

      const res = await signIn.email({
        email: values.email,
        password: values.password,
      });

      if (res.error) {
        toast.error(res.error.message || "Invalid email or password");
        return;
      }

      const userRes = await fetch("/api/me");

      if (!userRes.ok) {
        toast.error("Unable to load profile");
        return;
      }

      const user: User = await userRes.json();

      if (!user?.role) {
        toast.error("User role not found");
        return;
      }

      // Restrict this portal to specific roles (e.g. students only).
      if (allowRoles && !allowRoles.includes(user.role)) {
        await signOut();
        toast.error(
          "This portal is for students only. Please sign in with a student account.",
        );
        return;
      }

      toast.success("Login successful");

      // 💡 FORCE SWR TO INSTANTLY DETECT THE NEW LOGGED-IN SESSION
      await refreshUser();

      setOpen?.(false);
      router.push(roleRoutes[user.role]);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (statusLoading || !forgotEmail.trim()) return;
    try {
      setStatusLoading(true);
      setResetStatus(null);
      const res = await checkPasswordResetStatusAction(forgotEmail.trim());
      if (res.success) {
        setResetStatus(res.requests || []);
      } else {
        toast.error(res.error || "Failed to check status");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setStatusLoading(false);
    }
  };

  const statusMessages: Record<
    string,
    { icon: string; title: string; color: string }
  > = {
    PENDING: {
      icon: "⏳",
      title:
        "Your request is awaiting admin approval. Please check back later.",
      color: "text-amber-600",
    },
    COMPLETED: {
      icon: "✅",
      title:
        "Your password reset request was approved! You can now log in with your new password.",
      color: "text-emerald-600",
    },
    REJECTED: {
      icon: "❌",
      title:
        "Your request was declined by an admin. Please contact support or try again.",
      color: "text-red-600",
    },
    NOT_FOUND: {
      icon: "🔍",
      title: "No active password reset request found for this email address.",
      color: "text-slate-500",
    },
  };

  const handleForgotPassword = async () => {
    if (forgotLoading || !forgotEmail.trim() || !forgotPassword.trim()) return;

    try {
      setForgotLoading(true);
      const res = await forgotPasswordAction(
        forgotEmail.trim(),
        forgotPassword,
      );

      if (res.success) {
        toast.success(res.message);
        setShowForgotPassword(false);
        setForgotEmail("");
        setForgotPassword("");
      } else {
        toast.error(res.error || "Failed to submit request");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-sm sm:text-base transition-all duration-200 shadow-lg shadow-blue-600/20">
            Log In
          </Button>
        </DialogTrigger>
      )}

      <DialogContent
        className={`p-5 sm:p-6 md:p-8 overflow-y-auto max-h-[90vh] w-[92vw] transition-all duration-300 ease-in-out rounded-2xl ${
          showForgotPassword ? "max-w-2xl sm:max-w-3xl" : "max-w-md"
        }`}
      >
        <DialogHeader className="space-y-1 sm:space-y-2">
          <DialogTitle className="text-xl font-extrabold text-center">
            {brandConfig.name}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-center">
            Read e-books, manage borrowings, and reserve books.
          </DialogDescription>
        </DialogHeader>

        <div
          className={`mt-4 sm:mt-6 grid grid-cols-1 gap-6 transition-all duration-300 ${
            showForgotPassword ? "md:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {/* Main Login Form Column */}
          <form
            onSubmit={handleSubmit(handleLogin)}
            className="space-y-3 sm:space-y-4 w-full"
          >
            <div className="space-y-1 sm:space-y-1.5">
              <Label className="text-xs sm:text-sm">Email Address</Label>
              <Input
                autoFocus
                autoComplete="email"
                type="email"
                placeholder="student@gmail.com"
                {...register("email")}
                className="h-10 sm:h-11 rounded-xl text-sm"
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <Label className="text-xs sm:text-sm">Password</Label>
              <div className="relative">
                <Input
                  autoComplete="current-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  {...register("password")}
                  className="h-10 sm:h-11 rounded-xl pr-10 text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {showPassword ? (
                    <EyeClosed className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(!showForgotPassword)}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer font-medium"
              >
                {showForgotPassword ? "Hide Reset Panel" : "Forgot Password?"}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 sm:h-11 mt-2 rounded-xl font-bold cursor-pointer text-sm"
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* Forgot Password Column (Appears side-by-side on md+ screens) */}
          {showForgotPassword && (
            <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/80 dark:bg-gray-900/50 flex flex-col justify-between w-full h-full">
              <div className="space-y-3">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    Forgot Password
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Enter your email and desired new password. An admin will
                    review your request.
                  </p>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <Label className="text-xs sm:text-sm">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="h-10 sm:h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <Label className="text-xs sm:text-sm">New Password</Label>
                  <div className="relative">
                    <Input
                      type={showForgotPasswordInput ? "text" : "password"}
                      placeholder="Enter desired new password"
                      value={forgotPassword}
                      onChange={(e) => setForgotPassword(e.target.value)}
                      className="h-10 sm:h-11 rounded-xl pr-10 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setShowForgotPasswordInput((prev) => !prev)
                      }
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg"
                    >
                      {showForgotPasswordInput ? (
                        <EyeClosed className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={
                    forgotLoading ||
                    !forgotEmail.trim() ||
                    !forgotPassword.trim()
                  }
                  className="w-full h-10 sm:h-11 rounded-xl font-bold cursor-pointer text-sm mt-1"
                >
                  {forgotLoading ? "Submitting..." : "Submit Request"}
                </Button>

                <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={handleCheckStatus}
                    disabled={statusLoading || !forgotEmail.trim()}
                    className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline cursor-pointer font-medium disabled:opacity-50"
                  >
                    {statusLoading
                      ? "Checking..."
                      : "Check Status of Existing Request"}
                  </button>

                  {resetStatus && (
                    <div className="mt-2 max-h-40 overflow-y-auto space-y-2 pr-1">
                      {resetStatus.length === 0 ? (
                        <div className="text-xs text-slate-500">🔍 No password reset requests found for this email.</div>
                      ) : (
                        resetStatus.map((req) => {
                          const msg = statusMessages[req.status];
                          return (
                            <div key={req.id} className="text-xs bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 p-2.5 space-y-1">
                              <div className={`flex items-center gap-1.5 font-medium ${msg?.color || "text-slate-500"}`}>
                                <span>{msg?.icon || "ℹ️"}</span>
                                <span>{req.status}</span>
                              </div>
                              <div className="text-slate-400 dark:text-slate-500 space-y-0.5 pl-5">
                                <p>Requested: {new Date(req.createdAt).toLocaleString()}</p>
                                <p>Last updated: {new Date(req.updatedAt).toLocaleString()}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
