"use client";
import { useState, useEffect } from "react";
import {
  X,
  Send,
  AlertTriangle,
  Users,
  Loader2,
  Bell,
  History,
  CheckCircle,
  Clock,
  Calendar,
  Eye,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { toast } from "sonner";


interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  userId: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function AlertModal({ isOpen, onClose }: AlertModalProps) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState("send");
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        console.log("Escape key pressed - closing modal");
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Fetch history when tab changes to history
  useEffect(() => {
    if (activeTab === "history" && isOpen) {
      console.log("History tab activated - fetching history");
      fetchHistory();
    }
  }, [activeTab, isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    console.log("Modal Close Triggered");
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      console.log("Fetching notification history...");

      const response = await fetch("/api/notifications/announcement");

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized. Please login again.");
        }
        throw new Error(`Failed to fetch history (${response.status})`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`Fetched ${data.data?.length || 0} notifications`);
        setHistory(data.history || []);
      } else {
        throw new Error(data.error || "Failed to fetch history");
      }
    } catch (error: any) {
      console.error("Failed to fetch notification history:", error);
      setHistoryError(error.message || "Failed to load history");
      toast.error(error.message || "Failed to load notification history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSend = async () => {
    if (!title || !message) {
      toast.error("Please fill in both fields.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/notifications/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Broadcast sent successfully to all users!");
        setTitle("");
        setMessage("");
        handleClose();
      } else {
        toast.error(data.error || "Failed to send notification");
      }
    } catch (error) {
      toast.error("An error occurred while sending the notification.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className={`
        fixed inset-0 z-50
        flex items-center justify-center p-4
        transition-all duration-300
        ${
          isOpen && !isClosing ? "opacity-100" : "opacity-0 pointer-events-none"
        }
      `}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Modal */}
      <div
        className={`
          relative z-10 w-full max-w-2xl
          bg-white dark:bg-gray-900
          rounded-2xl shadow-2xl
          border border-gray-200/50 dark:border-gray-700/50
          transform transition-all duration-300
          max-h-[90vh] flex flex-col
          ${
            isOpen && !isClosing
              ? "scale-100 opacity-100"
              : "scale-95 opacity-0"
          }
        `}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200/60 dark:border-gray-700/60 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Notifications
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Send alerts or view history
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 flex-shrink-0">
          <Tabs
            value={activeTab}
            onValueChange={(value) => {
              console.log("Tab Changed:", value);
              setActiveTab(value);
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <TabsTrigger
                value="send"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm transition-all"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Alert
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm transition-all"
              >
                <History className="w-4 h-4 mr-2" />
                History
                {history.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                  >
                    {history.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Send Tab Content */}
            <TabsContent value="send" className="mt-4 space-y-5">
              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Alert Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Library Closure Notice"
                  className={`
                    w-full px-4 py-2.5
                    bg-gray-50/80 dark:bg-gray-800/50
                    border border-gray-200 dark:border-gray-700
                    focus:border-amber-400 dark:focus:border-amber-500
                    focus:ring-2 focus:ring-amber-400/30 dark:focus:ring-amber-500/30
                    rounded-xl
                    text-sm text-gray-800 dark:text-gray-200
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                    transition-all duration-200
                    outline-none
                  `}
                  disabled={loading}
                />
              </div>

              {/* Message Input */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={4}
                  className={`
                    w-full px-4 py-2.5
                    bg-gray-50/80 dark:bg-gray-800/50
                    border border-gray-200 dark:border-gray-700
                    focus:border-amber-400 dark:focus:border-amber-500
                    focus:ring-2 focus:ring-amber-400/30 dark:focus:ring-amber-500/30
                    rounded-xl
                    text-sm text-gray-800 dark:text-gray-200
                    placeholder:text-gray-400 dark:placeholder:text-gray-500
                    transition-all duration-200
                    resize-none
                    outline-none
                  `}
                  disabled={loading}
                />
              </div>

              {/* Info Box */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    This alert will be sent to all users on the platform.
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-500/60 dark:text-amber-400/60" />
                    <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">
                      Affects all registered users
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* History Tab Content */}
            <TabsContent value="history" className="mt-4">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : historyError ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
                  <h4 className="text-sm font-medium text-red-600 dark:text-red-400">
                    Failed to load history
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {historyError}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={fetchHistory}
                  >
                    Try Again
                  </Button>
                </div>
              ) : history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    No notifications sent
                  </h4>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Send your first alert to see it here
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {history.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 rounded-xl border border-gray-200/60 dark:border-gray-700/60 hover:border-amber-200/50 dark:hover:border-amber-800/30 transition-colors bg-white dark:bg-gray-800/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                                {notification.title}
                              </h4>
                              {notification.isRead ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Read
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                >
                                  <Clock className="w-3 h-3 mr-1" />
                                  Unread
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {formatDate(notification.createdAt)}
                              </div>
                              {notification.user && (
                                <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                  <Users className="w-3 h-3" />
                                  Sent by: {notification.user.name}
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 flex-shrink-0"
                            onClick={() => {
                              toast.info(`Notification: ${notification.title}`);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Modal Footer - Only show for Send tab */}
        {activeTab === "send" && (
          <div className="p-6 bg-gray-50/60 dark:bg-gray-800/30 border-t border-gray-200/60 dark:border-gray-700/60 rounded-b-2xl flex-shrink-0">
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className={`
                  w-full sm:w-auto px-6 py-2.5
                  text-sm font-medium text-gray-600 dark:text-gray-400
                  hover:text-gray-800 dark:hover:text-gray-200
                  hover:bg-gray-100 dark:hover:bg-gray-800
                  rounded-xl transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={loading || !title || !message}
                className={`
                  relative w-full sm:w-auto px-6 py-2.5
                  bg-amber-500 hover:bg-amber-600
                  dark:bg-amber-600 dark:hover:bg-amber-700
                  text-white font-medium text-sm
                  rounded-xl
                  shadow-sm hover:shadow-md
                  transition-all duration-200
                  hover:scale-[1.02] active:scale-[0.98]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  disabled:hover:scale-100
                  overflow-hidden
                `}
              >
                <div className="flex items-center justify-center gap-2.5">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Alert</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
