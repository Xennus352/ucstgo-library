"use client";

import { useEffect, useState } from "react";
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
  LayersIcon,
  AlertCircleIcon,
} from "lucide-react";
import { getLibraryStats } from "@/app/actions/bookStatus";


type LibraryMetrics = {
  totalBooks: string;
  booksThisMonthTrend: string;
  totalAuthors: string;
  genreTrend: string;
  availableCopies: string;
  currentlyBorrowedTrend: string;
  totalCategories: string;
};

export function SectionCards() {
  const [metrics, setMetrics] = useState<LibraryMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const response = await getLibraryStats();
      if (response.success && response.data) {
        setMetrics(response.data as LibraryMetrics);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card animate-pulse">
            <CardHeader>
              <div className="h-4 w-32 rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="mt-2 h-8 w-20 rounded-md bg-slate-300 dark:bg-slate-700" />
              <CardAction>
                <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
              </CardAction>
            </CardHeader>
            <CardFooter>
              <div className="h-3 w-full rounded-md bg-slate-200 dark:bg-slate-800" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {/* Total Unique Titles */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Cataloged Titles</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics?.totalBooks ?? "0"}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 text-emerald-600 dark:text-emerald-400"
            >
              <BookOpenIcon className="size-3" /> {metrics?.booksThisMonthTrend}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">
          Unique book titles registered in system
        </CardFooter>
      </Card>

      {/* Total Registered Authors */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Authors</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics?.totalAuthors ?? "0"}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 text-indigo-600 dark:text-indigo-400"
            >
              <UsersIcon className="size-3" /> {metrics?.totalCategories}{" "}
              Categories
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">
          {metrics?.genreTrend ?? "Contributing catalog literary creators"}
        </CardFooter>
      </Card>

      {/* Total Copies In House */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Available Copies</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics?.availableCopies ?? "0"}
          </CardTitle>
          <CardAction>
            <Badge
              variant="outline"
              className="gap-1 text-blue-600 dark:text-blue-400"
            >
              <LayersIcon className="size-3" /> Volume
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">
          {metrics?.currentlyBorrowedTrend ??
            "Copies physically restocked on shelves"}
        </CardFooter>
      </Card>

      {/* Overdue Items (Placeholder mapped safely to total categories data structure) */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>System Categories</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {metrics?.totalCategories ?? "0"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              <AlertCircleIcon className="size-3" /> Genres
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">
          Total structural classifications across inventory
        </CardFooter>
      </Card>
    </div>
  );
}
