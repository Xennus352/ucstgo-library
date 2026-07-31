"use client";

import { ActivityIcon, ShieldAlertIcon, BugIcon, UsersIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonitoringOverview } from "@/components/admin/monitoring/MonitoringOverview";
import { SecurityEventsTable } from "@/components/admin/monitoring/SecurityEventsTable";
import { SystemErrorsPanel } from "@/components/admin/monitoring/SystemErrorsPanel";
import { ActiveUsersPanel } from "@/components/admin/monitoring/ActiveUsersPanel";

export default function MonitoringPage() {
  return (
    <div className="px-4 lg:px-8 pb-8">
      <div className="rounded-xl border bg-white p-4 mb-6 dark:bg-slate-900/60 dark:border-slate-800/40">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-10 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
            <ActivityIcon className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Monitoring & Security
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Website traffic analytics, threat detection, and system issue
              tracking.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto"
        >
          <TabsTrigger value="overview" className="gap-2">
            <ActivityIcon className="size-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <ShieldAlertIcon className="size-4" />
            Security Events
          </TabsTrigger>
          <TabsTrigger value="issues" className="gap-2">
            <BugIcon className="size-4" />
            System Issues
          </TabsTrigger>
          <TabsTrigger value="active-users" className="gap-2">
            <UsersIcon className="size-4" />
            Active Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <MonitoringOverview />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecurityEventsTable />
        </TabsContent>

        <TabsContent value="issues" className="mt-6">
          <SystemErrorsPanel />
        </TabsContent>

        <TabsContent value="active-users" className="mt-6">
          <ActiveUsersPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
