import { CourseOverviewSkeleton } from "@/features/learning/course-player/ui/player/course-overview/overview-skeleton";
import { SkeletonBreadcrumb, SkeletonPage } from "@/shared/ui/page-skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonBreadcrumb />
      <CourseOverviewSkeleton />
    </SkeletonPage>
  );
}
