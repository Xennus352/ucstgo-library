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
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ✅ SOCKET.IO CONNECTION (REAL-TIME)
  useEffect(() => {
    if (!user?.id) return;

    const socket = io();

    socket.emit("join", user.id);

    socket.on("new-notification", (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const displayNotifications = notifications.slice(0, 5);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />

          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-0" align="end">
        <div className="px-3 py-2 border-b text-xs font-semibold">
          Notifications
        </div>

        <div className="max-h-56 overflow-y-auto">
          {displayNotifications.length === 0 ? (
            <div className="p-3 text-xs text-gray-400">No notifications</div>
          ) : (
            displayNotifications.map((item) => (
              <div key={item.id} className="px-3 py-2">
                <p className="text-xs font-medium">{item.title}</p>
                <p className="text-[10px] text-gray-500">{item.message}</p>
                <p className="text-[9px] text-gray-400">
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
