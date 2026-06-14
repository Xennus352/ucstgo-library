"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpenIcon,
  UsersIcon,
  FileCheckIcon,
  AlertCircleIcon,
} from "lucide-react";

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {/* Total Books */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Cataloged Books</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            12,450
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 text-emerald-600 dark:text-emerald-400"
            >
              <BookOpenIcon className="size-3" /> +48 new
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">
          Updated 20 mins ago across all branches
        </CardFooter>
      </Card>

      {/* Active Borrowers */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Borrowers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1,124
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              <UsersIcon className="size-3" /> 88% active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">
          Currently verified student/staff readers
        </CardFooter>
      </Card>

      {/* Books Issued */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Books Currently Issued</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            342
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 text-blue-600 dark:text-blue-400"
            >
              <FileCheckIcon className="size-3" /> Peak Term
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">
          Steady increase in checkout volume this week
        </CardFooter>
      </Card>

      {/* Overdue Items */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Overdue Reminders</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl text-destructive">
            14
          </CardTitle>
          <CardAction>
            <Badge variant="destructive" className="gap-1">
              <AlertCircleIcon className="size-3" /> Action Reqd
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">
          Requires automatic notification dispatches
        </CardFooter>
      </Card>
    </div>
  );
}
