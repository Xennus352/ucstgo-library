import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getPageNumbers } from "@/lib/pagination";

interface BookPaginationProps {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

export function BookPagination({
  page,
  totalPages,
  hasNextPage,
  isLoading,
  onPageChange,
}: BookPaginationProps) {
  const numbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex gap-1.5 items-center flex-wrap">
      <Button
        variant="outline"
        size="sm"
        className="hover:cursor-pointer"
        onClick={() => onPageChange(Math.max(page - 1, 1))}
        disabled={page === 1 || isLoading}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Previous
      </Button>

      {numbers.map((n, i) =>
        n === "…" ? (
          <span
            key={`ellipsis-${i}`}
            className="px-1 text-sm text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Button
            key={n}
            variant={n === page ? "default" : "outline"}
            size="sm"
            className="hover:cursor-pointer min-w-9"
            onClick={() => onPageChange(n)}
            disabled={isLoading}
          >
            {n}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="sm"
        className="hover:cursor-pointer"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNextPage || isLoading}
      >
        Next
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}
