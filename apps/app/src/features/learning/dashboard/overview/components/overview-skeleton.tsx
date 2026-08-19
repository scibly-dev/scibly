import { Skeleton } from "@scibly/ui/components/skeleton";

import { SkeletonStatTiles } from "@/shared/ui/page-skeleton";

const panelClass =
  "flex flex-col gap-4 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900";

// Shared by both `loading.tsx` boundaries under /learn — the subtree one
// draws the header and tabs itself, the segment one leaves them to the
// mounted layout.
export function LearningOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      <SkeletonStatTiles />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {[0, 1].map((panel) => (
          <section key={panel} className={panelClass}>
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((row) => (
                <Skeleton key={row} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
