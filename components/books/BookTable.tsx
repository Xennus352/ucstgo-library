import { BookOpen, Edit } from "lucide-react";
import { Button } from "../ui/button";
import { DeleteBookDialog } from "./DeleteBookDialog";

function SkeletonRow() {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-800 animate-pulse">
      <td className="p-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
      </td>
      <td className="p-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24" />
      </td>
      <td className="p-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-28" />
      </td>
      <td className="p-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
      </td>
      <td className="p-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16" />
      </td>
      <td className="p-4">
        <div className="flex gap-2">
          <div className="h-4 w-8 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </td>
    </tr>
  );
}

export function BookTable({
  data,
  onEdit,
  onDelete,
  isLoading,
}: {
  data: any[];
  onEdit?: (book: any) => void;
  onDelete?: (book: any) => void;
  isLoading?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="text-left p-4 font-semibold text-sm">Title</th>
              <th className="text-left p-4 font-semibold text-sm">Author</th>
              <th className="text-left p-4 font-semibold text-sm">ISBN</th>
              <th className="text-left p-4 font-semibold text-sm">Category</th>
              <th className="text-left p-4 font-semibold text-sm">Status</th>
              <th className="text-left p-4 font-semibold text-sm">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <BookOpen className="w-12 h-12 opacity-20" />
                    <p>No books found.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((book) => (
                <tr
                  key={book.id}
                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Title */}
                  <td className="p-4 text-sm font-medium">{book.title}</td>

                  {/* Author  */}
                  <td className="p-4 text-sm">{book.author?.name || "N/A"}</td>

                  {/* ISBN */}
                  <td className="p-4 text-sm font-mono">
                    {book.isbn || "N/A"}
                  </td>

                  {/* Category FIX */}
                  <td className="p-4 text-sm">
                    <span className="inline-flex px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs">
                      {book.category?.name || "Uncategorized"}
                    </span>
                  </td>

                  {/* Status  (safe fallback) */}
                  <td className="p-4 text-sm">
                    <span className="text-xs text-muted-foreground">
                      {book.availability?.available ?? 0} /{" "}
                      {book.availability?.total ?? 0} available
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => onEdit?.(book.id)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>

                      <DeleteBookDialog book={book} onDelete={onDelete} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
