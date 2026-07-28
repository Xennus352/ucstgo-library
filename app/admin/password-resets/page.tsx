"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  ShieldCheck,
  Lock,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  KeyRound,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  acceptPasswordResetAction,
  rejectPasswordResetAction,
  getPasswordResetRequests,
} from "@/app/actions/password-reset";
import { useSocketEvent } from "@/hooks/use-socket";

interface PasswordResetRequest {
  id: string;
  userId: string;
  token: string;
  status: string;
  requestedPasswordHash: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    studentId: string | null;
    role: string;
  };
}

interface FormattedResetRequest extends Omit<PasswordResetRequest, "createdAt" | "updatedAt" | "expiresAt"> {
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export default function AdminPasswordResetPage() {
  const [resetRequests, setResetRequests] = useState<FormattedResetRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "PENDING" | "COMPLETED" | "EXPIRED" | "REJECTED"
  >("PENDING");
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    requestId: string;
    action: "accept" | "reject";
    userName: string;
  } | null>(null);

  const loadResetRequests = useCallback(async () => {
    setIsLoading(true);
    const result = await getPasswordResetRequests();
    if (result.success && result.data) {
      const formatted = (result.data as PasswordResetRequest[]).map((req) => ({
        ...req,
        createdAt: req.createdAt instanceof Date
          ? req.createdAt.toISOString()
          : req.createdAt,
        updatedAt: req.updatedAt instanceof Date
          ? req.updatedAt.toISOString()
          : req.updatedAt,
        expiresAt: req.expiresAt instanceof Date
          ? req.expiresAt.toISOString()
          : req.expiresAt,
      }));
      setResetRequests(formatted);
    } else {
      toast.error(result.error || "Failed to load password reset requests");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadResetRequests();
  }, [loadResetRequests]);

  useSocketEvent("password-reset:requested", loadResetRequests);
  useSocketEvent("password-reset:completed", loadResetRequests);
  useSocketEvent("password-reset:rejected", loadResetRequests);

  const filteredRequests = useMemo(() => {
    let filtered = [...resetRequests];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (req) =>
          req.user.name.toLowerCase().includes(query) ||
          req.user.email.toLowerCase().includes(query) ||
          req.user.studentId?.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    return filtered;
  }, [resetRequests, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: resetRequests.length,
    pending: resetRequests.filter((r) => r.status === "PENDING").length,
    completed: resetRequests.filter((r) => r.status === "COMPLETED").length,
    rejected: resetRequests.filter((r) => r.status === "REJECTED").length,
  }), [resetRequests]);

  const handleAccept = async () => {
    if (!confirmAction) return;
    setIsProcessing(confirmAction.requestId);
    try {
      const res = await acceptPasswordResetAction(confirmAction.requestId);
      if (!res.success) throw new Error(res.error);
      toast.success(res.message);
      setConfirmAction(null);
      await loadResetRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept request");
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!confirmAction) return;
    setIsProcessing(confirmAction.requestId);
    try {
      const res = await rejectPasswordResetAction(confirmAction.requestId);
      if (!res.success) throw new Error(res.error);
      toast.success(res.message);
      setConfirmAction(null);
      await loadResetRequests();
    } catch (err: any) {
      toast.error(err.message || "Failed to reject request");
    } finally {
      setIsProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle className="h-3 w-3 mr-1" /> Completed
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" /> Expired
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Password Reset Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Review and manage user password reset requests
            </p>
          </div>
          <Button variant="outline" onClick={loadResetRequests} className="cursor-pointer">
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Requests</p>
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-amber-100 dark:border-amber-900">
            <div className="flex items-center justify-between">
              <p className="text-xs text-amber-600 dark:text-amber-400">Pending</p>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-green-100 dark:border-green-900">
            <div className="flex items-center justify-between">
              <p className="text-xs text-green-600 dark:text-green-400">Completed</p>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.completed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-red-100 dark:border-red-900">
            <div className="flex items-center justify-between">
              <p className="text-xs text-red-600 dark:text-red-400">Rejected</p>
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full md:w-[200px] px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm appearance-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="EXPIRED">Expired</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested Password
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires At
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider print:hidden">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="animate-pulse flex items-center justify-center">
                        <Clock className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      No password reset requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {req.user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {req.user.email}
                            </p>
                            {req.user.studentId && (
                              <p className="text-[11px] font-mono text-gray-400">
                                ID: {req.user.studentId}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {req.requestedPasswordHash ? (
                          <div className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                              Password provided
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {format(new Date(req.createdAt), "MMM d, yyyy HH:mm")}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {format(new Date(req.expiresAt), "MMM d, yyyy HH:mm")}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                      <td className="px-4 py-3 text-center print:hidden">
                        {req.status === "PENDING" && (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => setConfirmAction({ requestId: req.id, action: "accept", userName: req.user.name })}
                              disabled={isProcessing === req.id}
                              className="bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                            >
                              <ThumbsUp className="h-3 w-3 mr-1" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setConfirmAction({ requestId: req.id, action: "reject", userName: req.user.name })}
                              disabled={isProcessing === req.id}
                              className="cursor-pointer"
                            >
                              <ThumbsDown className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                        {req.status !== "PENDING" && (
                          <span className="text-xs text-gray-400 italic">
                            {req.status === "COMPLETED" ? "Approved" : req.status === "REJECTED" ? "Rejected" : "N/A"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "accept" ? "Accept Password Reset" : "Reject Password Reset"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.action === "accept"
                ? `This will change the password for ${confirmAction?.userName} to the one they requested. They will be able to log in with their new password.`
                : `This will reject the password reset request from ${confirmAction?.userName}. They will be notified.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction?.action === "accept" ? handleAccept : handleReject}
              disabled={isProcessing === confirmAction?.requestId}
              className={confirmAction?.action === "accept"
                ? "bg-green-600 text-white hover:bg-green-700 cursor-pointer"
                : "bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              }
            >
              {isProcessing === confirmAction?.requestId
                ? "Processing..."
                : confirmAction?.action === "accept"
                  ? "Accept"
                  : "Reject"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
