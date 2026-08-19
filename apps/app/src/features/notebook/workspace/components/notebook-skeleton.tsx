import { Skeleton } from "@scibly/ui/components/skeleton";
import { cn } from "@scibly/ui/utils";

import {
  notebookAppFrame,
  notebookCanvas,
  notebookHeaderBar,
  notebookShell,
  notebookShellPadding,
  notebookSidebar,
  notebookSidebarBorder,
  notebookTimelineFrame,
  notebookTimelineInset,
  notebookTimelineSurface,
} from "./notebook-shell";

/**
 * Fallback for the notebook routes, which render outside the profile shell.
 * Repeats two shell constants instead of importing them (260px is
 * CreatorSidebar's SIDEBAR_WIDTH, 38% is the right panel's defaultSize) to
 * avoid pulling the client workspace into this boundary's bundle.
 */
export function NotebookSkeleton({
  variant = "workspace",
}: {
  variant?: "workspace" | "history";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex h-screen w-full flex-col overflow-hidden",
        notebookShell,
        notebookShellPadding,
      )}
    >
      <div className={notebookAppFrame}>
        <div
          className={cn(
            "hidden h-full w-[260px] shrink-0 flex-col overflow-hidden border-r-2 md:flex",
            notebookSidebar,
            notebookSidebarBorder,
          )}
        >
          <div className="flex items-center justify-between px-4 py-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <div className="px-3 pb-2">
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
          <div className="flex flex-col gap-1 px-3">
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
          <div className="mt-6 flex flex-col gap-2 px-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>
        </div>

        <div className={cn("flex min-w-0 flex-1 flex-col", notebookCanvas)}>
          <div
            className={cn(
              "flex h-14 shrink-0 items-center justify-between px-4 md:px-6",
              notebookHeaderBar,
            )}
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>

          {variant === "history" ? (
            <div className="flex flex-1 flex-col items-center overflow-hidden px-6 pt-6 pb-10">
              <div className="flex w-full max-w-xl flex-col gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : (
            <div className={notebookTimelineFrame}>
              <div className={notebookTimelineInset}>
                <div
                  className={cn(
                    "mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-6 pb-10",
                    notebookTimelineSurface,
                  )}
                >
                  <Skeleton className="h-8 w-72 max-w-full" />
                  <Skeleton className="h-28 w-full rounded-[20px]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {variant === "workspace" ? (
          <div
            className={cn(
              "hidden h-full w-[38%] shrink-0 flex-col overflow-hidden border-l-2 md:flex",
              notebookSidebar,
              notebookSidebarBorder,
            )}
          >
            <div className="flex items-center gap-5 px-5 py-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-14" />
            </div>
            <div className="flex flex-col gap-2.5 px-5">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
