"use client";

export function MediaLibrarySkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-4 pb-6 @md/media:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="aspect-[4/5] animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800"
        />
      ))}
    </div>
  );
}
