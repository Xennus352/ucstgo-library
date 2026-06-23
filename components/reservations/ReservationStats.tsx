"use client";

import { Book, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface StatsProps {
  stats: {
    total: number;
    active: number;
    fulfilled: number;
    cancelled: number;
    expired: number;
  };
}

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

export function ReservationStats({ stats }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard label="Total Reservations" value={stats.total} icon={Book} color="bg-blue-500" />
      <StatCard label="Active" value={stats.active} icon={Clock} color="bg-yellow-500" />
      <StatCard label="Fulfilled" value={stats.fulfilled} icon={CheckCircle} color="bg-green-500" />
      <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle} color="bg-gray-500" />
      <StatCard label="Expired" value={stats.expired} icon={AlertCircle} color="bg-red-500" />
    </div>
  );
}