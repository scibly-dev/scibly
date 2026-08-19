import { Skeleton } from "@scibly/ui/components/skeleton";
import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";

import { DataTableLayout } from "./components/data-table-layout";

// Stack these in the same order as the real screen, so a route's `loading.tsx`
// lands content in place instead of shoving the page around once it resolves.
export function SkeletonPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-8 pb-20" aria-hidden>
      {children}
    </div>
  );
}

export function SkeletonPageHeader({
  size = "lg",
  action,
}: {
  size?: "lg" | "sm";
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Skeleton className={size === "lg" ? "h-9 w-64" : "h-7 w-56"} />
        <Skeleton
          className={cn("h-4 w-full max-w-96", size === "lg" ? "mt-3" : "mt-2")}
        />
      </div>
      {action}
    </div>
  );
}

export function SkeletonBreadcrumb() {
  return (
    <div className="-mb-2 flex items-center gap-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

export function SkeletonSearchToolbar() {
  return (
    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <Skeleton className="h-10 w-full rounded-xl sm:w-[320px]" />
      <Skeleton className="h-10 w-full rounded-xl sm:w-40" />
    </div>
  );
}

export function SkeletonSettingsCards({ count }: { count: number }) {
  return (
    <div className="flex w-full flex-col gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(cardClass, "flex flex-col")}>
          <div className="flex flex-col gap-4 p-6">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <div className="border-edge bg-ground flex items-center justify-end rounded-b-[18px] border-t-2 px-6 py-4">
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatTiles({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-[20px]" />
      ))}
    </div>
  );
}

export function SkeletonTabs({ count }: { count: number }) {
  return (
    <div className="border-edge bg-ground flex w-fit items-center gap-1 rounded-[14px] border-2 p-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-28 rounded-[10px]" />
      ))}
    </div>
  );
}

export function SkeletonTable({
  rows = 10,
  columns = 4,
  heightClass,
}: {
  rows?: number;
  columns?: number;
  heightClass?: string;
}) {
  return (
    <DataTableLayout
      heightClass={heightClass}
      toolbar={
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Skeleton className="h-9 w-full rounded-xl sm:max-w-xs" />
          <Skeleton className="h-9 w-40 rounded-xl" />
        </div>
      }
      pagination={<Skeleton className="h-8 w-56" />}
    >
      <div className="divide-hairline divide-y-2">
        <div className="border-hairline bg-ground-soft flex items-center gap-6 border-b-2 px-4 py-3 sm:px-6">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex items-center gap-6 px-4 py-3 sm:px-6">
            <div className="flex flex-1 items-center space-x-4">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-3 w-[100px]" />
              </div>
            </div>
            {Array.from({ length: columns - 1 }).map((_, col) => (
              <Skeleton key={col} className="h-4 max-w-[120px] flex-1" />
            ))}
          </div>
        ))}
      </div>
    </DataTableLayout>
  );
}

// Next.js subtree-level fallback for the `/profile` and `/profile/org/[orgSlug]`
// route boundaries; per-route `loading.tsx` files use the blocks above instead.
export function PageSkeleton() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader />
      <Skeleton className="h-32 w-full rounded-[20px]" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-20 w-full rounded-[20px]" />
        <Skeleton className="h-20 w-full rounded-[20px]" />
        <Skeleton className="h-20 w-full rounded-[20px]" />
      </div>
    </SkeletonPage>
  );
}
