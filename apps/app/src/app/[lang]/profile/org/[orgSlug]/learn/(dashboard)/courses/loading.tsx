import { CourseSkeletonGrid } from "@/features/learning/dashboard/enrolled-courses/course-skeleton-grid";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex min-h-[560px] flex-col">
        <CourseSkeletonGrid />
      </div>
    </div>
  );
}
