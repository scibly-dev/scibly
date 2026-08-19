import { Skeleton } from "@scibly/ui/components/skeleton";

import { UxCardShell } from "./ux-card-shell";

// A tool input is partial until its call completes, so there is nothing to draw yet — without this the card pops into existence fully formed a beat after the text above it.
export function UxCardSkeleton() {
  return (
    <UxCardShell aria-busy>
      <div className="space-y-3 px-5 py-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-5/6 rounded-xl" />
      </div>
    </UxCardShell>
  );
}
