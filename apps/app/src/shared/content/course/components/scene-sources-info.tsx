"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@scibly/ui/components/popover";
import { cn } from "@scibly/ui/utils";
import { FileText } from "lucide-react";

export interface SceneSourceInfo {
  id: string;
  name: string;
  type: string;
}

interface SceneSourcesInfoProps {
  sources: readonly SceneSourceInfo[];
  label: string;
  className?: string;

  maxVisible?: number;
  moreSourcesLabel?: string;
}

export const SourcePill = ({
  source,
  className,
}: {
  source: SceneSourceInfo;
  className?: string;
}) => {
  return (
    <span
      title={source.name}
      className={cn(
        "inline-flex max-w-[180px] min-w-0 items-center gap-1 rounded-md border border-neutral-200/80 bg-neutral-50 px-1.5 py-0.5 text-[10px] text-neutral-600 dark:border-neutral-700/80 dark:bg-neutral-900/60 dark:text-neutral-300",
        className,
      )}
    >
      <FileText className="h-3 w-3 shrink-0 text-neutral-400 dark:text-neutral-500" />
      <span className="truncate">{source.name}</span>
    </span>
  );
};

export function SceneSourcesInfo({
  sources,
  label,
  className,
  maxVisible = 5,
  moreSourcesLabel,
}: SceneSourcesInfoProps) {
  if (sources.length === 0) return null;

  const visible = sources.slice(0, maxVisible);
  const hiddenCount = sources.length - visible.length;

  return (
    <div className={cn("flex min-w-0 items-start gap-1.5 px-1", className)}>
      <span className="shrink-0 pt-0.5 text-[9px] font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {visible.map((source) => (
          <SourcePill key={source.id} source={source} />
        ))}
        {hiddenCount > 0 && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center rounded-md border border-neutral-200/80 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600 transition-colors hover:bg-neutral-100 dark:border-neutral-700/80 dark:bg-neutral-900/60 dark:text-neutral-300 dark:hover:bg-neutral-800/80"
              >
                {moreSourcesLabel?.replace("{{count}}", String(hiddenCount)) ??
                  `+${hiddenCount} more`}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-72 p-2"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <p className="mb-2 px-1 text-[10px] font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
                {label} ({sources.length})
              </p>
              <div className="custom-scrollbar flex max-h-48 flex-col gap-1 overflow-y-auto">
                {sources.map((source) => (
                  <SourcePill
                    key={source.id}
                    source={source}
                    className="w-full max-w-none"
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
