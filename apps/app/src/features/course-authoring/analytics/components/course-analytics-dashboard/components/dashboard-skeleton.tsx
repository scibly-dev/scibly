import { Skeleton } from "@scibly/ui/components/skeleton";
import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Filter bar */}
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[160px] rounded-xl" />
        <Skeleton className="h-9 w-[150px] rounded-xl" />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-2xl" />
        ))}
      </div>

      {/* Active Tab Panel skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-[280px] rounded-[20px]" />
      </div>
    </div>
  );
}
