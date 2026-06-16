"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, LogOut, Shield, GraduationCap } from "lucide-react";
import { User } from "@/types/UserType";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  handleLogout: () => void;
}

export function ProfileDialog({
  open,
  onOpenChange,
  user,
  handleLogout,
}: ProfileDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* TRIGGER REMOVED: It is now handled by the NavUser dropdown menu */}

      {/* MODAL CONTENT */}
      <DialogContent className="sm:max-w-175 p-0 overflow-hidden bg-card text-card-foreground rounded-2xl shadow-2xl border border-border">
        {/* TOP ACCENT BAR */}
        <div className="h-1.5 w-full bg-linear-to-rfrom-primary via-secondary to-primary" />

        {/* MAIN LAYOUT */}
        <div className="flex flex-col md:flex-row">
          {/* LEFT COLUMN: Avatar & Role (Sticky on Desktop) */}
          <div className="w-full md:w-1/3 bg-muted/30 border-b md:border-b-0 md:border-r border-border p-6 flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                {user?.image && (
                  <AvatarImage src={user?.image} alt={user.name} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-card" />
            </div>

            <DialogTitle className="text-xl font-bold text-foreground">
              {user.name}
            </DialogTitle>

            <DialogDescription className="text-muted-foreground text-sm mt-1">
              {user.faculty}
            </DialogDescription>

            <Badge
              variant="secondary"
              className="mt-4 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
            >
              <Shield className="w-3 h-3 mr-1.5" />
              {user?.role}
            </Badge>

            <div className="mt-6 w-full space-y-2 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ID:</span>
                <span className="font-mono font-medium text-foreground">
                  {user?.studentId}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Joined:</span>
                <span className="font-medium text-foreground">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : ""}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Details & Info */}
          <div className="w-full md:w-2/3 p-6 md:p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-lg font-semibold">
                Account Details
              </DialogTitle>
              <DialogDescription>
                Manage your personal information and preferences.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Email Row */}
              <div className="flex items-start gap-4 group">
                <div className="p-2 bg-muted/50 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Email Address
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {user.email}
                  </p>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Phone Row */}
              <div className="flex items-start gap-4 group">
                <div className="p-2 bg-muted/50 rounded-lg text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Phone Number
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {user?.phone}
                  </p>
                </div>
              </div>

              <Separator className="bg-border" />

              {/* Faculty - Redesigned */}
              <div className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md">
                {/* Royal Blue Accent Bar */}
                <div className="absolute left-0 top-0 h-full w-1 bg-primary" />

                <div className="flex items-center gap-4 p-4">
                  {/* Icon Container with "Cutout" Effect */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-background">
                    <GraduationCap className="h-5 w-5" />
                  </div>

                  {/* Typography */}
                  <div className="flex flex-col">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Department
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {user.faculty ?? "Not Assigned"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 bg-linear-to-b from-transparent to-muted/20 px-6 py-4.5">
          {/* Left side - Elegant System Metadata */}
          <div className="flex flex-row sm:flex-col items-center sm:items-start gap-1.5 sm:gap-0.5 opacity-80 group">
            <span className="text-[10px] font-bold text-foreground/80 tracking-widest uppercase transition-colors group-hover:text-primary">
              UCSTgo Library
            </span>
            <span className="hidden sm:inline text-[14px] text-muted-foreground/30 font-light leading-none">
              |
            </span>
            <p className="text-[10px] font-medium text-muted-foreground tracking-wide lg:pb-3">
              © 2026 University Library System
            </p>
          </div>

          {/* Right side - Refined Micro-Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto pb-2 justify-center sm:justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8.5 px-4 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all rounded-lg"
            >
              Close
            </Button>

            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="h-8.5 px-4 text-xs font-semibold text-destructive/90 hover:text-destructive hover:bg-destructive/10 active:bg-destructive/15 transition-all duration-200 rounded-lg border border-transparent hover:border-destructive/20"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5 stroke-[2.5]" />
              Sign out
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
