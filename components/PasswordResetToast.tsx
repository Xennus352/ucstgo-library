"use client";

import { useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSocketEvent, getSocketInstance } from "@/hooks/use-socket";
import { toast } from "sonner";

export function PasswordResetToast() {
  const { user } = useCurrentUser();

  useEffect(() => {
    if (!user?.id) return;
    const socket = getSocketInstance();
    socket.emit("join", user.id);
  }, [user?.id]);

  useSocketEvent("password-reset:requested", (data: unknown) => {
    if (!user || (user.role !== "ADMIN" && user.role !== "LIBRARIAN")) return;
    const { email } = data as { email: string };
    toast.info(`Password reset requested by ${email}`);
  });

  useSocketEvent("password-reset:completed", () => {
    toast.success("Your password reset request has been accepted. You can now log in with your new password.");
  });

  useSocketEvent("password-reset:rejected", () => {
    toast.error("Your password reset request has been rejected by an administrator. Please contact support for assistance.");
  });

  return null;
}
