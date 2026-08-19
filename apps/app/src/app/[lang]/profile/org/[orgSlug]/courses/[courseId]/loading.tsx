import { Skeleton } from "@scibly/ui/components/skeleton";
import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";

import {
  SkeletonBreadcrumb,
  SkeletonPage,
  SkeletonTabs,
} from "@/shared/ui/page-skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonBreadcrumb />

      {/* CourseHeroBanner: a tall card holding badge, title, description, meta. */}
      <div
        className={cn(
          cardClass,
          "w-full overflow-hidden pt-16 pb-12 lg:pt-20 lg:pb-16",
        )}
      >
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-8 lg:px-12">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-12 w-full max-w-xl md:h-14" />
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <SkeletonTabs count={3} />
        <Skeleton className="h-64 w-full rounded-[20px]" />
      </div>
    </SkeletonPage>
  );
}
