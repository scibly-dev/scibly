import { Skeleton } from "@scibly/ui/components/skeleton";

export function CourseOverviewSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8">
      <header className="flex w-full items-center gap-4 px-1">
        <Skeleton className="size-16 shrink-0 rounded-[18px]" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-7 w-full max-w-sm" />
          <div className="mt-2.5 flex items-center gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <Skeleton className="size-14 shrink-0 rounded-full" />
      </header>

      <div className="flex w-full flex-col items-center gap-10 pb-14">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}

export function CoursePlayerLoading() {
  return (
    <div className="w-full pb-20">
      <CourseOverviewSkeleton />
    </div>
  );
}
