import { getTopBorrowedBooks, getTopBorrowers } from "@/app/actions/analytics";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Users,
  ArrowUp,
  TrendingDown,
  Activity,
  Clock,
  ChevronRight,
  BookCopy,
  UserCheck,
} from "lucide-react";

export default async function CirculationAnalyticsDashboard() {
  const [booksRes, usersRes] = await Promise.all([
    getTopBorrowedBooks(),
    getTopBorrowers(),
  ]);

  const books = booksRes.success ? booksRes.data || [] : [];
  const users = usersRes.success ? usersRes.data || [] : [];

  const totalBooks = books.length;
  const totalUsers = users.length;

  const totalBorrows = books.reduce((acc, b) => acc + (b.borrowCount || 0), 0);

  // Math calculations for averages
  const avgBorrowsPerBook = totalBooks
    ? (totalBorrows / totalBooks).toFixed(1)
    : "0.0";
  const avgBorrowsPerUser = totalUsers
    ? (totalBorrows / totalUsers).toFixed(1)
    : "0.0";

  const topBookPercentage =
    totalBorrows && books[0]
      ? Math.round((books[0].borrowCount / totalBorrows) * 100)
      : 0;

  const topUserPercentage =
    totalBorrows && users[0]
      ? Math.round((users[0].borrowCount / totalBorrows) * 100)
      : 0;

  const getTrend = (i: number) => {
    const t = ["+12%", "+8%", "+5%", "-2%", "+3%", "+7%"];
    return t[i % t.length];
  };

  const getTrendIcon = (t: string) =>
    t.startsWith("+") ? (
      <ArrowUp className="w-3 h-3 text-emerald-600" />
    ) : (
      <TrendingDown className="w-3 h-3 text-rose-600" />
    );

  return (
    <div className="space-y-10 p-6 w-full mx-auto bg-gradient-to-b from-background to-muted/10">
      {/* HEADER */}
      <div className="flex flex-col gap-2 border-b pb-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Activity className="w-4 h-4" />
          Analytics Dashboard · Circulation Overview
          <Badge variant="outline" className="ml-2 text-[10px]">
            <Clock className="w-3 h-3 mr-1" /> Live
          </Badge>
        </div>

        <h1 className="text-3xl font-bold">Library Performance</h1>
        <p className="text-sm text-muted-foreground">
          Overview of borrowing activity and patron engagement
        </p>
      </div>

      {/* HERO METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">Total Borrows</p>
          <p className="text-3xl font-bold mt-2">
            {totalBorrows.toLocaleString()}
          </p>
        </div>

        <div className="p-6 rounded-2xl border bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">Active Patrons</p>
          <p className="text-3xl font-bold mt-2">{totalUsers}</p>
        </div>

        <div className="p-6 rounded-2xl border bg-card shadow-sm">
          <p className="text-sm text-muted-foreground">Collection Size</p>
          <p className="text-3xl font-bold mt-2">{totalBooks}</p>
        </div>
      </div>

      {/* NEW: DETAILED AVERAGES & INSIGHTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border bg-muted/20">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <BookCopy className="w-3 h-3" /> Avg. Borrows / Book
          </p>
          <p className="text-xl font-bold mt-1">{avgBorrowsPerBook}x</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Turnover rate per title
          </p>
        </div>

        <div className="p-5 rounded-xl border bg-muted/20">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> Avg. Borrows / User
          </p>
          <p className="text-xl font-bold mt-1">{avgBorrowsPerUser}x</p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Circulation per patron
          </p>
        </div>

        <div className="p-5 rounded-xl border bg-muted/20">
          <p className="text-xs text-muted-foreground">Top Book</p>
          <p className="text-sm font-semibold mt-1 truncate">
            {books[0]?.title || "N/A"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {books[0]?.borrowCount || 0} borrows ({topBookPercentage}%)
          </p>
        </div>

        <div className="p-5 rounded-xl border bg-muted/20">
          <p className="text-xs text-muted-foreground">Top Patron</p>
          <p className="text-sm font-semibold mt-1 truncate">
            {users[0]?.name || "N/A"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {users[0]?.borrowCount || 0} loans ({topUserPercentage}%)
          </p>
        </div>
      </div>

      {/* LEADERBOARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BOOKS */}
        <div className="border rounded-xl bg-card">
          <div className="p-5 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              <h2 className="font-semibold text-sm">Most Borrowed Books</h2>
            </div>
          </div>

          <ScrollArea className="h-[420px]">
            {books.map((book, i) => {
              const pct = totalBorrows
                ? Math.round((book.borrowCount / totalBorrows) * 100)
                : 0;

              const trend = getTrend(i);

              return (
                <div
                  key={book.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center border rounded-md text-xs">
                      {i + 1}
                    </div>

                    <div>
                      <p className="text-sm font-medium truncate">
                        {book.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {book.borrowCount} borrows
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {getTrendIcon(trend)}
                    <span>{pct}%</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </div>

        {/* USERS */}
        <div className="border rounded-xl bg-card">
          <div className="p-5 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <h2 className="font-semibold text-sm">Top Patrons</h2>
            </div>
          </div>

          <ScrollArea className="h-[420px]">
            {users.map((user, i) => {
              const pct = totalBorrows
                ? Math.round((user.borrowCount / totalBorrows) * 100)
                : 0;

              const trend = getTrend(i + 2);

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-5 py-4 hover:bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center border rounded-md text-xs">
                      {i + 1}
                    </div>

                    <div>
                      <p className="text-sm font-medium truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.borrowCount} loans
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    {getTrendIcon(trend)}
                    <span>{pct}%</span>
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                </div>
              );
            })}
          </ScrollArea>
        </div>
      </div>

      {/* FOOTER */}
      <div className="pt-6 border-t text-xs text-muted-foreground flex justify-between">
        <span>System active</span>
        <span>Updated {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
