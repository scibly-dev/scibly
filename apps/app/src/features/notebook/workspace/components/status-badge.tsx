"use client";

import { cn } from "@scibly/ui/utils";
import { AlertCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";

import { type SourceStatus } from "@/shared/content/sources/constants";

const STATUS_STYLES = {
  PENDING:
    "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800/40 dark:bg-yellow-950/40 dark:text-yellow-400",
  PROCESSING:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-400",
  READY:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400",
  FAILED:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-950/40 dark:text-red-400",
} as const;

interface StatusBadgeProps {
  status: SourceStatus;

  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const style = STATUS_STYLES[status];

  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-wide",
        style,
      )}
    >
      {status === "PENDING" && <Clock className="h-2.5 w-2.5 shrink-0" />}
      {status === "PROCESSING" && (
        <Loader2 className="h-2.5 w-2.5 shrink-0 animate-spin" />
      )}
      {status === "READY" && <CheckCircle2 className="h-2.5 w-2.5 shrink-0" />}
      {status === "FAILED" && <AlertCircle className="h-2.5 w-2.5 shrink-0" />}
      {label}
    </span>
  );
}
