import { Skeleton } from "@scibly/ui/components/skeleton";

import { LearningOverviewSkeleton } from "@/features/learning/dashboard/overview/components/overview-skeleton";
import { SkeletonPage, SkeletonPageHeader } from "@/shared/ui/page-skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader />
      {/* LearnTabs: an underlined strip, not the pill row the other pages use. */}
      <div className="flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {[0, 1, 2].map((tab) => (
          <Skeleton key={tab} className="mx-4 my-2.5 h-4 w-20" />
        ))}
      </div>
      <LearningOverviewSkeleton />
    </SkeletonPage>
  );
}
