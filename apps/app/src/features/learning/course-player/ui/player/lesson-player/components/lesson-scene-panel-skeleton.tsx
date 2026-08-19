import { Skeleton } from "@scibly/ui/components/skeleton";

export function LessonScenePanelSkeleton() {
  return (
    <div className="relative mx-auto w-full max-w-2xl shrink-0">
      <div className="w-full space-y-4 py-2 @min-[48rem]:py-4">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}
