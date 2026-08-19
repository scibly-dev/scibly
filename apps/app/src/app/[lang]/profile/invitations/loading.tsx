import { Skeleton } from "@scibly/ui/components/skeleton";

import {
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSettingsCards,
} from "@/shared/ui/page-skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader
        size="sm"
        action={<Skeleton className="h-10 w-full rounded-xl sm:w-72" />}
      />
      <SkeletonSettingsCards count={3} />
    </SkeletonPage>
  );
}
