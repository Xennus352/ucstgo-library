"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { io } from "socket.io-client";
import { useCurrentUser } from "@/hooks/use-current-user";

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export default function NotificationBell() {
  const { user } = useCurrentUser();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        cache: "no-store",
      });

      const data = await res.json();

      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        // Immediate UI update
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            isRead: true,
          })),
        );

        // Sync with database
        await loadNotifications();
      }
    } catch (err) {
      console.error("Failed to mark notifications as read:", err);
    }
  }, [loadNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    const socket = io();

    socket.emit("join", user.id);

    socket.on("new-notification", (notification: Notification) => {
      setNotifications((prev) => [
        {
          ...notification,
          isRead: false,
        },
        ...prev,
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const displayNotifications = notifications.slice(0, 5);

  return (
    <Popover
      open={open}
      onOpenChange={async (value) => {
        setOpen(value);

        if (value && unreadCount > 0) {
          await markAllAsRead();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-72 p-0" align="end">
        <div className="border-b px-3 py-2 text-xs font-semibold">
          Notifications
        </div>

        <div className="max-h-72 overflow-y-auto">
          {displayNotifications.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No notifications
            </div>
          ) : (
            displayNotifications.map((item) => (
              <div
                key={item.id}
                className={`border-b px-3 py-2 last:border-b-0 ${
                  !item.isRead ? "bg-muted/40" : ""
                }`}
              >
                <p className="text-xs font-medium">{item.title}</p>

                <p className="mt-1 text-[11px] text-muted-foreground">
                  {item.message}
                </p>

                <p className="mt-1 text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
