import { Skeleton } from "@scibly/ui/components/skeleton";

export function CourseSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 content-start gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="border-hairline flex flex-col overflow-hidden rounded-[20px] border-2 bg-white shadow-[0_4px_0_0_var(--color-lip)]"
        >
          {/* Top Banner */}
          <div className="bg-ground relative h-48 w-full shrink-0">
            <div className="absolute top-4 right-4 z-10">
              <Skeleton className="h-6 w-24 rounded-xl bg-white/60" />
            </div>
          </div>

          <div className="flex flex-1 flex-col p-6">
            <div className="mb-6 flex-1">
              <Skeleton className="mb-4 h-6 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>

            <div className="border-hairline mt-auto flex items-center justify-between border-t-2 pt-5">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
