"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BookOpenIcon, UsersIcon, LayersIcon } from "lucide-react";
import { getLibraryStats } from "@/app/actions/bookStatus";

type LibraryMetrics = {
  totalBooks: number;
  totalAuthors: number;
  totalCategories: number;
  booksThisMonthTrend?: number;
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
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="mt-3 h-8 w-20 bg-slate-300 rounded" />
            </CardHeader>
            <CardFooter>
              <div className="h-3 w-full bg-slate-200 rounded" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-3">
      {/* TOTAL BOOKS */}
      <Card>
        <CardHeader>
          <CardDescription>Total Books</CardDescription>
          <CardTitle className="text-3xl">{metrics?.totalBooks ?? 0}</CardTitle>
          <Badge variant="outline" className="gap-1 w-fit text-emerald-600">
            <BookOpenIcon className="size-3" />+
            {metrics?.booksThisMonthTrend ?? 0} this month
          </Badge>
        </CardHeader>

        <CardFooter className="text-sm text-muted-foreground">
          Unique book titles registered in system
        </CardFooter>
      </Card>

      {/* TOTAL AUTHORS */}
      <Card>
        <CardHeader>
          <CardDescription>Total Authors</CardDescription>
          <CardTitle className="text-3xl">
            {metrics?.totalAuthors ?? 0}
          </CardTitle>
          <Badge variant="outline" className="gap-1 w-fit text-blue-600">
            <UsersIcon className="size-3" />
            Active contributors
          </Badge>
        </CardHeader>

        <CardFooter className="text-sm text-muted-foreground">
          Registered authors in library system
        </CardFooter>
      </Card>

      {/* TOTAL CATEGORIES */}
      <Card>
        <CardHeader>
          <CardDescription>Total Categories</CardDescription>
          <CardTitle className="text-3xl">
            {metrics?.totalCategories ?? 0}
          </CardTitle>
          <Badge variant="outline" className="gap-1 w-fit text-purple-600">
            <LayersIcon className="size-3" />
            Genres & classifications
          </Badge>
        </CardHeader>

        <CardFooter className="text-sm text-muted-foreground">
          Structural classification of all books
        </CardFooter>
      </Card>
    </div>
  );
}
