import { Skeleton } from "@scibly/ui/components/skeleton";

// Mirrors LessonBuilder's frame (fixed overlay, header bar, 20/50/30 panel split), since the
// shared page skeleton appeared frameless on this full-screen route.
export function LessonBuilderSkeleton() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white dark:bg-neutral-950"
    >
      <header className="border-hairline flex h-14 shrink-0 items-center gap-3 border-b-2 px-4 dark:border-neutral-800/60">
        <Skeleton className="h-8 w-8 rounded-[10px]" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-14 rounded-[10px]" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="border-hairline flex w-[20%] shrink-0 flex-col gap-2 border-r-2 p-3 dark:border-neutral-800/60">
          <Skeleton className="h-8 w-full rounded-[10px]" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>

        <div className="bg-ground flex w-[50%] flex-1 flex-col dark:bg-neutral-900/50">
          <div className="border-hairline flex h-12 shrink-0 items-center justify-between border-b-2 bg-white px-4 dark:border-neutral-800/60 dark:bg-neutral-950">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-28 rounded-[10px]" />
          </div>
          <div className="flex flex-1 flex-col items-center gap-4 p-6">
            <Skeleton className="h-full w-full max-w-3xl rounded-2xl" />
          </div>
        </div>

        <div className="border-hairline flex w-[30%] shrink-0 flex-col gap-3 border-l-2 p-4 dark:border-neutral-800/60">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full rounded-[10px]" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
