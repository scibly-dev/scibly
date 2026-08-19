import { Skeleton } from "@scibly/ui/components/skeleton";

// This segment streams on its own — the parent `profile/loading.tsx` doesn't cover client-side navigations into it.
export default function Loading() {
  return (
    <div className="bg-ground flex min-h-screen w-full justify-center px-4 py-12">
      <div className="flex w-full max-w-4xl flex-col items-center gap-8">
        <Skeleton className="h-28 w-28 rounded-2xl" />
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-5 w-64 max-w-full" />
        </div>
        <Skeleton className="h-64 w-full max-w-2xl rounded-2xl" />
      </div>
    </div>
  );
}
