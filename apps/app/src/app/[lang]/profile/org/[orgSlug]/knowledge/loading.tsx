import { Skeleton } from "@scibly/ui/components/skeleton";

import { SkeletonPage, SkeletonPageHeader } from "@/shared/ui/page-skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader />
      <div className="flex flex-col gap-5">
        <Skeleton className="h-10 w-36 rounded-xl" />
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} className="h-36 w-full rounded-[20px]" />
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
