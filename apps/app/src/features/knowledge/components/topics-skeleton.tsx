import { Skeleton } from "@scibly/ui/components/skeleton";

export function TopicsSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      <Skeleton className="h-10 w-36 rounded-xl" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-36 w-full rounded-[20px]" />
        ))}
      </div>
    </div>
  );
}
