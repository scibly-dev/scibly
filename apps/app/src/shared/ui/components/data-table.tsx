import { Button } from "@scibly/ui/components/button";
import { Input } from "@scibly/ui/components/input";
import { Skeleton } from "@scibly/ui/components/skeleton";
import { cn } from "@scibly/ui/utils";
import { Loader2, Search } from "lucide-react";
import React from "react";

import { DataTableLayout } from "./data-table-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

export interface Column<T> {
  header: React.ReactNode;
  cell: (item: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTablePagination {
  viewingText?: React.ReactNode;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  loadMoreText?: React.ReactNode;
  loadingText?: React.ReactNode;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPreviousPage?: boolean;
  previousText?: React.ReactNode;
  nextText?: React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  isFetching?: boolean;
  skeletonCount?: number;
  emptyMessage?: React.ReactNode;
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;

  heightClass?: string;

  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;

  pagination?: DataTablePagination;
}

export const DataTableToolbar = ({
  filters,
  onSearchChange,
  search,
  searchPlaceholder,
}: Pick<
  DataTableProps<unknown>,
  "filters" | "onSearchChange" | "search" | "searchPlaceholder"
>) => {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div className="relative w-full flex-1 sm:max-w-xs">
        {search !== undefined ? (
          <>
            <Search className="text-ink-faint absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="h-9 pl-9"
            />
          </>
        ) : null}
      </div>
      {filters && (
        <div className="flex flex-wrap items-center gap-2">{filters}</div>
      )}
    </div>
  );
};

export const DataTablePaginationControls = ({
  pagination,
}: {
  pagination: DataTablePagination;
}) => {
  const hasPageControls = pagination.onPrevious || pagination.onNext;

  return (
    <div className="text-ink-soft flex w-full items-center justify-between text-[13px]">
      <div>{pagination.viewingText}</div>
      <div className="flex items-center gap-2">
        {pagination.onLoadMore && pagination.hasNextPage ? (
          <Button
            variant="outline"
            size="sm"
            onClick={pagination.onLoadMore}
            disabled={pagination.isFetchingNextPage}
            className="rounded-[10px]"
          >
            {pagination.isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {pagination.loadingText || "Loading..."}
              </>
            ) : (
              pagination.loadMoreText || "Load more"
            )}
          </Button>
        ) : null}
        {hasPageControls ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-[10px] shadow-none"
              onClick={pagination.onPrevious}
              disabled={!pagination.hasPreviousPage}
            >
              {pagination.previousText || "Previous"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-[10px] shadow-none"
              onClick={pagination.onNext}
              disabled={!pagination.hasNextPage}
            >
              {pagination.nextText || "Next"}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export const LoadingTableRows = <T,>({
  columns,
  rowCount,
}: {
  columns: Column<T>[];
  rowCount: number;
}) => {
  return Array.from({ length: rowCount }).map((_, rowIndex) => (
    <TableRow key={`skeleton-row-${rowIndex}`}>
      {columns.map((col, colIndex) => (
        <TableCell
          key={`skeleton-cell-${rowIndex}-${colIndex}`}
          className={cn("px-4 py-3 sm:px-6", col.cellClassName)}
        >
          <div className="flex items-center space-x-4">
            {colIndex === 0 ? (
              <>
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[150px]" />
                  <Skeleton className="h-3 w-[100px]" />
                </div>
              </>
            ) : (
              <Skeleton className="h-4 w-full max-w-[120px]" />
            )}
          </div>
        </TableCell>
      ))}
    </TableRow>
  ));
};

export const PopulatedTableRows = <T,>({
  columns,
  data,
  keyExtractor,
  onRowClick,
}: Pick<
  DataTableProps<T>,
  "columns" | "data" | "keyExtractor" | "onRowClick"
>) => {
  return data.map((item) => (
    <TableRow
      key={keyExtractor(item)}
      className={cn(
        "group border-0 hover:bg-[#f7f9fd]",
        onRowClick ? "cursor-pointer" : undefined,
      )}
      onClick={() => onRowClick?.(item)}
    >
      {columns.map((col, index) => (
        <TableCell
          key={index}
          className={cn("px-4 py-3 sm:px-6", col.cellClassName)}
        >
          {col.cell(item)}
        </TableCell>
      ))}
    </TableRow>
  ));
};

export const DataTableRows = <T,>(props: DataTableProps<T>) => {
  const {
    columns,
    data,
    emptyMessage = "No items found.",
    isFetching,
    isLoading,
    skeletonCount = 10,
  } = props;
  if (isLoading || isFetching) {
    return (
      <LoadingTableRows
        columns={columns}
        rowCount={data.length > 0 ? data.length : skeletonCount}
      />
    );
  }
  if (data.length === 0) {
    return (
      <TableRow>
        <TableCell
          colSpan={columns.length}
          className="text-ink-soft h-32 text-center text-[14px]"
        >
          {emptyMessage}
        </TableCell>
      </TableRow>
    );
  }
  return <PopulatedTableRows {...props} />;
};

export function DataTable<T>(props: DataTableProps<T>) {
  const { columns, filters, heightClass, pagination, search } = props;
  const toolbar =
    search !== undefined || filters !== undefined ? (
      <DataTableToolbar
        search={search}
        onSearchChange={props.onSearchChange}
        searchPlaceholder={props.searchPlaceholder ?? "Search..."}
        filters={filters}
      />
    ) : undefined;
  const paginationNode = pagination ? (
    <DataTablePaginationControls pagination={pagination} />
  ) : undefined;

  return (
    <DataTableLayout
      toolbar={toolbar}
      pagination={paginationNode}
      heightClass={heightClass}
    >
      <Table
        className="relative w-full table-fixed text-left text-sm"
        wrapperClassName="h-full"
      >
        <TableHeader className="border-hairline bg-ground-soft sticky top-0 z-10 border-b-2">
          <TableRow className="border-0 hover:bg-transparent">
            {columns.map((col, index) => (
              <TableHead
                key={index}
                className={cn(
                  "text-ink px-4 py-3 text-[13px] font-semibold sm:px-6",
                  col.headerClassName,
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-hairline divide-y-2">
          <DataTableRows {...props} />
        </TableBody>
      </Table>
    </DataTableLayout>
  );
}
