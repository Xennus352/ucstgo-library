"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signIn } from "@/lib/auth-client";
import { roleRoutes } from "@/lib/role-routes";

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
import { Eye, EyeClosed } from "lucide-react";

interface LoginDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export default function LoginDialog({
  isOpen,
  onOpenChange,
  showTrigger = true,
}: LoginDialogProps) {
  const router = useRouter();
  const { refreshUser } = useCurrentUser(); 

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button className="flex-1 px-8 py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl font-bold text-base transition-all duration-200 shadow-lg shadow-blue-600/20">
            Log In
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="p-6 sm:p-8 overflow-hidden w-[92vw] max-w-md rounded-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-2xl font-extrabold">
            Next-Gen Tech Library
          </DialogTitle>
          <DialogDescription className="text-sm">
            Read e-books, manage borrowings and reserve workstations.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleLogin)} className="space-y-4 mt-6">
          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <Input
              autoFocus
              autoComplete="email"
              type="email"
              placeholder="student@gmail.com"
              {...register("email")}
              className="h-11 rounded-xl"
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Password</Label>
            <div className="relative">
              <Input
                autoComplete="current-password"
                type={showPassword ? "text" : "password"}
                placeholder="********"
                {...register("password")}
                className="h-11 rounded-xl pr-12"
              />
              <Button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground bg-transparent hover:cursor-pointer hover:bg-blue-200"
              >
                {showPassword ? <EyeClosed className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-2 rounded-xl font-bold hover:cursor-pointer"
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}