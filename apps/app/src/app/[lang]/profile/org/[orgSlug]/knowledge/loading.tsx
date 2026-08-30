import { TopicsSkeleton } from "@/features/knowledge/screen";
import { SkeletonPage, SkeletonPageHeader } from "@/shared/ui/page-skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader />
      <TopicsSkeleton />
    </SkeletonPage>
  );
}
