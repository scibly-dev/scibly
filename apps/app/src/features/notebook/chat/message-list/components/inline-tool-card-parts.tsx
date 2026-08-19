"use client";

import { cn } from "@scibly/ui/utils";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

interface InlineToolStatusBannerProps {
  variant: "completed" | "error" | "denied" | "loading";
  title: string;
  detail?: string;
  action?: React.ReactNode;
}

const statusStyles = {
  completed:
    "border-neutral-200/80 bg-neutral-50/80 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300",
  error:
    "border-red-200/80 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/20",
  denied:
    "border-neutral-200/80 bg-neutral-50/80 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300",
  loading:
    "border-neutral-200/80 bg-neutral-50/80 text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-400",
} as const;

export function InlineToolStatusBanner({
  variant,
  title,
  detail,
  action,
}: InlineToolStatusBannerProps) {
  if (variant === "error") {
    return (
      <div className={cn("rounded-xl border px-3 py-2.5", statusStyles.error)}>
        <div className="flex items-start gap-2">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-red-950 dark:text-red-100">
              {title}
            </p>
            {detail ? (
              <p className="mt-1 text-xs leading-relaxed text-red-900/80 dark:text-red-200/80">
                {detail}
              </p>
            ) : null}
            {action ? <div className="mt-2">{action}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  const iconClassName = cn(
    "h-4 w-4 shrink-0",
    variant === "completed" && "text-emerald-600 dark:text-emerald-400",
    variant === "loading" && "animate-spin",
    variant === "denied" && "text-neutral-400",
  );

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs",
        statusStyles[variant],
      )}
    >
      {variant === "completed" ? (
        <CheckCircle2 className={iconClassName} />
      ) : variant === "loading" ? (
        <Loader2 className={iconClassName} />
      ) : (
        <XCircle className={iconClassName} />
      )}
      {title}
    </div>
  );
}

interface DestructiveApprovalCardShellProps {
  children: React.ReactNode;
}

export function DestructiveApprovalCardShell({
  children,
}: DestructiveApprovalCardShellProps) {
  return (
    <div className="rounded-xl border border-red-200/80 bg-red-50/30 dark:border-red-900/40 dark:bg-red-950/20">
      {children}
    </div>
  );
}
