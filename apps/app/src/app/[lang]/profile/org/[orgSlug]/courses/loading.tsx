import { CourseSkeletonGrid } from "@/features/course-authoring/courses/list/components/course-skeleton-grid";
import {
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSearchToolbar,
} from "@/shared/ui/page-skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader />
      <div className="flex flex-col gap-6">
        <SkeletonSearchToolbar />
        <CourseSkeletonGrid />
      </div>
    </SkeletonPage>
  );
}
