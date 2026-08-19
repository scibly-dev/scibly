"use client";

import type { NotebookMessage } from "@/features/notebook/chat/contracts";

import { cn } from "@scibly/ui/utils";

import { notebookMessageSurface } from "../../../workspace/components/notebook-shell";
import { CopyButton } from "../../copy-button";

const userCopyRow =
  "flex h-7 w-full items-center justify-end opacity-0 transition-opacity duration-200 delay-300 group-hover/user:opacity-100 group-hover/user:delay-0 group-focus-within/user:opacity-100 group-focus-within/user:delay-0";

export const UserMessageBubble = ({
  message,
  text,
  canCopy,
}: {
  message: NotebookMessage | undefined;
  text: string;
  canCopy: boolean;
}) => {
  if (!message || !text.trim()) return null;
  return (
    <div className="flex w-full justify-end">
      <div className="group/user w-max max-w-[min(85%,28rem)]">
        <div
          className={cn(
            "text-ink rounded-[20px] px-4 py-2.5 text-left text-[15px] leading-relaxed dark:text-neutral-100",
            notebookMessageSurface,
          )}
        >
          {text}
        </div>
        {canCopy ? (
          <div className={userCopyRow}>
            <CopyButton textToCopy={text} />
          </div>
        ) : null}
      </div>
    </div>
  );
};
