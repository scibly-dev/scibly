"use client";

import type { UxClientToolName } from "@/features/notebook/chat/tools/client-tool-definitions";

import { cn } from "@scibly/ui/utils";
import { AlertCircle } from "lucide-react";

import {
  notebookBorder,
  notebookMessageSurface,
} from "../../../workspace/components/notebook-shell";
import { useMalformedUxToolCall } from "./use-malformed-ux-tool-call";

// A UX tool call whose input the schema rejected renders a visible error instead of nothing, so the transcript doesn't read like the agent stopped mid-sentence.
export function UxErrorCard({
  tool,
  toolCallId,
  isAnswered,
  body,
}: {
  tool: UxClientToolName;
  toolCallId: string | undefined;
  isAnswered: boolean;
  body: string;
}) {
  useMalformedUxToolCall({ tool, toolCallId, isAnswered });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[20px]",
        notebookBorder,
        notebookMessageSurface,
      )}
    >
      <div className="flex items-start gap-3 px-5 py-4">
        <AlertCircle
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
        <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">
          {body}
        </p>
      </div>
    </div>
  );
}
