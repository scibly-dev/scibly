"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@scibly/ui/utils";
import { CornerLeftUp } from "lucide-react";
import { createElement } from "react";

import {
  notebookBorder,
  notebookMessageSurface,
} from "../../../workspace/components/notebook-shell";
import { CopyButton } from "../../copy-button";

const submissionCopyRow =
  "flex h-7 w-full items-center justify-end opacity-0 transition-opacity duration-200 delay-300 group-hover/ux-submission:opacity-100 group-hover/ux-submission:delay-0 group-focus-within/ux-submission:opacity-100 group-focus-within/ux-submission:delay-0";

interface UxSubmissionBubbleProps {
  hint: string;
  label: string;
  detail?: string;
  copyText: string;
  canCopy?: boolean;
  icon: LucideIcon;
  children: React.ReactNode;
}

export function UxSubmissionBubble({
  hint,
  label,
  detail,
  copyText,
  canCopy = true,
  icon,
  children,
}: UxSubmissionBubbleProps) {
  return (
    <div className="mt-3 flex w-full justify-end">
      <div className="flex w-full max-w-[min(92%,34rem)] flex-col items-end gap-1.5">
        <div className="flex items-center gap-1.5 pr-0.5 text-[11px] font-medium tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
          <CornerLeftUp className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{hint}</span>
        </div>

        <div className={`group/ux-submission w-full max-w-[min(100%,32rem)]`}>
          <div
            className={cn(
              "overflow-hidden rounded-[20px]",
              notebookBorder,
              notebookMessageSurface,
            )}
          >
            <div className="flex gap-3 border-b border-[hsl(var(--section-accent)/0.12)] bg-[hsl(var(--section-accent)/0.04)] px-4 py-3 dark:border-[hsl(var(--section-accent)/0.2)] dark:bg-[hsl(var(--section-accent)/0.08)]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--section-accent)/0.14)] text-[hsl(var(--section-accent))] dark:bg-[hsl(var(--section-accent)/0.22)]">
                {createElement(icon, {
                  className: "h-4 w-4",
                  strokeWidth: 2,
                  "aria-hidden": true,
                })}
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-ink text-[13px] leading-tight font-semibold dark:text-neutral-50">
                  {label}
                </p>
                {detail && (
                  <p className="mt-0.5 text-[12px] leading-snug text-neutral-500 dark:text-neutral-400">
                    {detail}
                  </p>
                )}
              </div>
            </div>

            {children}
          </div>

          {canCopy && (
            <div className={submissionCopyRow}>
              <CopyButton textToCopy={copyText} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
