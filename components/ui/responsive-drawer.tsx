"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ResponsiveDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function ResponsiveDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
}: ResponsiveDrawerProps) {
  // Use custom hook or standard tailwind breakpoint checker
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border border-white/20">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-1">{children}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-md p-4 pt-2">
        <DrawerHeader className="text-left px-0">
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="max-h-[70vh] overflow-y-auto pb-6">{children}</div>
      </DrawerContent>
    </Drawer>
  );
}
