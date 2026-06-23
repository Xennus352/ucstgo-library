"use client";

import { format } from "date-fns";
import {
  User,
  Book,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Check,
  Ban,
} from "lucide-react";

interface Reservation {
  id: string;
  status: "ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED";
  reservedAt: string;
  expiresAt: string;
  user: { id: string; name: string; email: string; studentId?: string };
  book: { id: string; title: string; isbn: string; author: { name: string } };
}

interface TableProps {
  items: Reservation[];
  isProcessing: string | null;
  onFulfill: (id: string) => void;
  onCancel: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "FULFILLED":
      return "bg-green-50 text-green-700 border-green-200";
    case "CANCELLED":
      return "bg-gray-50 text-gray-700 border-gray-200";
    case "EXPIRED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return <Clock className="w-4 h-4" />;
    case "FULFILLED":
      return <CheckCircle className="w-4 h-4" />;
    case "CANCELLED":
      return <XCircle className="w-4 h-4" />;
    case "EXPIRED":
      return <AlertCircle className="w-4 h-4" />;
    default:
      return null;
  }
};

const getStatusLabel = (status: string) => {
  return status === "ACTIVE"
    ? "Pending"
    : status.charAt(0) + status.slice(1).toLowerCase();
};

const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

export function ReservationTable({
  items,
  isProcessing,
  onFulfill,
  onCancel,
}: TableProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Book
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reserved At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center">
                    <Book className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-lg font-medium">No reservations found</p>
                    <p className="text-sm">
                      Try adjusting your filters or search query
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((reservation) => {
                const expired = isExpired(reservation.expiresAt);
                return (
                  <tr
                    key={reservation.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {reservation.user.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {reservation.user.email}
                          </p>
                          {reservation.user.studentId && (
                            <p className="text-xs text-gray-400">
                              ID: {reservation.user.studentId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {reservation.book.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          by {reservation.book.author.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>
                        <p>
                          {format(
                            new Date(reservation.reservedAt),
                            "MMM d, yyyy",
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(reservation.reservedAt), "HH:mm")}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>
                        <p>
                          {format(
                            new Date(reservation.expiresAt),
                            "MMM d, yyyy",
                          )}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(reservation.expiresAt), "HH:mm")}
                        </p>
                        {expired && reservation.status === "ACTIVE" && (
                          <span className="text-xs text-red-600 font-medium">
                            Expired
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(reservation.status)}`}
                      >
                        {getStatusIcon(reservation.status)}
                        <span>{getStatusLabel(reservation.status)}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {reservation.status === "ACTIVE" && !expired && (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onFulfill(reservation.id)}
                            disabled={isProcessing === reservation.id}
                            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing === reservation.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            <span>Fulfill</span>
                          </button>
                          <button
                            onClick={() => onCancel(reservation.id)}
                            disabled={isProcessing === reservation.id}
                            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing === reservation.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                            <span>Cancel</span>
                          </button>
                        </div>
                      )}
                      {reservation.status === "ACTIVE" && expired && (
                        <span className="text-sm text-red-600 font-medium">
                          Auto-expired
                        </span>
                      )}
                      {reservation.status === "FULFILLED" && (
                        <span className="text-sm text-green-600">
                          ✓ Completed
                        </span>
                      )}
                      {(reservation.status === "CANCELLED" ||
                        reservation.status === "EXPIRED") && (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
