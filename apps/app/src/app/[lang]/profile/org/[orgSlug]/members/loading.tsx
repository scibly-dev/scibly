import { Skeleton } from "@scibly/ui/components/skeleton";

import {
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonTable,
} from "@/shared/ui/page-skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader />
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
        <SkeletonTable heightClass="h-[650px]" columns={5} />
      </div>
    </SkeletonPage>
  );
}
