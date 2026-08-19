import { useCallback, useState } from "react";

interface UsePaginationOptions {
  initialPage?: number;
  pageSize: number;
}

export function usePagination({
  initialPage = 1,
  pageSize,
}: UsePaginationOptions) {
  const [page, setPage] = useState(initialPage);

  const cursor = (page - 1) * pageSize;

  const getPaginationProps = useCallback(
    (totalCount: number | undefined, hasNextCursor: boolean) => {
      return {
        page,
        pageSize,
        cursor,
        hasPreviousPage: page > 1,
        hasNextPage: hasNextCursor,
        onNextPage: () => setPage((p) => p + 1),
        onPreviousPage: () => setPage((p) => Math.max(1, p - 1)),
        setPage,
        totalCount: totalCount ?? 0,
        totalPages: Math.ceil((totalCount ?? 0) / pageSize),
      };
    },
    [page, pageSize, cursor],
  );

  return {
    page,
    setPage,
    cursor,
    pageSize,
    getPaginationProps,
  };
}
