import {
  SkeletonPage,
  SkeletonPageHeader,
  SkeletonSettingsCards,
} from "@/shared/ui/page-skeleton";

export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeader />
      <SkeletonSettingsCards count={5} />
    </SkeletonPage>
  );
}
