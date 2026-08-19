export function PagePickerRowSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-3 px-5 py-3.5">
      <div className="h-4 w-4 shrink-0 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="h-3.5 w-3.5 shrink-0 rounded bg-neutral-200 dark:bg-neutral-700" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-3 w-3/5 rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-2.5 w-1/4 rounded bg-neutral-200/80 dark:bg-neutral-700/80" />
      </div>
      <div className="h-7 w-7 shrink-0 rounded bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}
