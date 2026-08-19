import { Button } from "@scibly/ui/components/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CoursePaginationProps {
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
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
    <div className="border-hairline mt-2 flex flex-col justify-between gap-4 border-t-2 pt-6 sm:flex-row sm:items-center">
      <p className="text-ink-soft text-sm">
        Showing{" "}
        <span className="text-ink font-semibold">
          {totalCount > 0 ? cursor + 1 : 0}
        </span>{" "}
        to{" "}
        <span className="text-ink font-semibold">
          {Math.min(cursor + itemsPerPage, totalCount)}
        </span>{" "}
        of <span className="text-ink font-semibold">{totalCount}</span> results
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="h-9 px-3"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="h-9 px-3"
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
