import {
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSettingsCards,
} from "@/shared/ui/page-skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader size="sm" />
      <SkeletonSettingsCards count={6} />
    </SkeletonPage>
  );
}
