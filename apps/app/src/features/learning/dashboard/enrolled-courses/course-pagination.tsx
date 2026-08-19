import { Button } from "@scibly/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CoursePaginationProps {
  currentPage: number;
  setCurrentPage: (page: number | ((previous: number) => number)) => void;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
}

export function CoursePagination({
  currentPage,
  setCurrentPage,
  totalPages,
  totalCount,
  itemsPerPage,
}: CoursePaginationProps) {
  const cursor = (currentPage - 1) * itemsPerPage;
  if (totalCount === 0) return null;

  return (
    <div className="mt-2 flex flex-col justify-between gap-4 border-t border-neutral-200/60 pt-6 sm:flex-row sm:items-center dark:border-neutral-800/60">
      <p className="text-muted-foreground text-sm">
        Showing{" "}
        <span className="text-foreground font-medium">{cursor + 1}</span> to{" "}
        <span className="text-foreground font-medium">
          {Math.min(cursor + itemsPerPage, totalCount)}
        </span>{" "}
        of <span className="text-foreground font-medium">{totalCount}</span>{" "}
        results
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          disabled={currentPage === 1}
          className="h-9 border-neutral-200/60 px-3 dark:border-neutral-800/60"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setCurrentPage((page) => Math.min(totalPages, page + 1))
          }
          disabled={currentPage === totalPages}
          className="h-9 border-neutral-200/60 px-3 dark:border-neutral-800/60"
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
