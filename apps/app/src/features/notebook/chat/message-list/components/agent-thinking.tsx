"use client";

import type { NotebookToolPart } from "@/features/notebook/chat/tools/tool-parts";
import type { ThinkingTimelineEntry } from "../utils/assistant-render-segments";

import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
} from "@scibly/ui/components/chain-of-thought";
import { Check, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";

import { MessageResponse } from "@/shared/ai/components/message";

import { groupConsecutiveToolSteps } from "../utils/tool-helpers";
import { AgentTimelineItem } from "./agent-timeline-item";
import { AgentToolStep } from "./agent-tool-step";

interface AgentThinkingProps {
  entries: ThinkingTimelineEntry[];
  isActive?: boolean;
  labels: {
    active: string;
    idle: string;
    done: string;
  };
}

function splitReasoningChunks(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

type TimelineItem =
  | { type: "reasoning"; key: string; text: string }
  | {
      type: "tool";
      key: string;
      step: ReturnType<typeof groupConsecutiveToolSteps>[number];
    }
  | { type: "done"; key: string };

function buildTimelineItems(
  entries: ThinkingTimelineEntry[],
  isActive: boolean,
) {
  const items: TimelineItem[] = [];
  let pendingToolParts: NotebookToolPart[] = [];
  const flushTools = () => {
    for (const step of groupConsecutiveToolSteps(pendingToolParts)) {
      items.push({ type: "tool", key: step.key, step });
    }
    pendingToolParts = [];
  };
  for (const entry of entries) {
    if (entry.type === "tool") {
      pendingToolParts.push(entry.part);
      continue;
    }
    flushTools();
    for (const [index, text] of splitReasoningChunks(entry.text).entries()) {
      items.push({
        type: "reasoning",
        key: `reasoning-${entry.partIndex}-${index}`,
        text,
      });
    }
  }
  flushTools();
  if (!isActive && items.length > 0) items.push({ type: "done", key: "done" });
  return items;
}

export function AgentThinking({
  entries,
  isActive = false,
  labels,
}: AgentThinkingProps) {
  const [isOpen, setIsOpen] = useState(false);

  const timelineItems = useMemo(
    () => buildTimelineItems(entries, isActive),
    [entries, isActive],
  );

  const headerLabel = isActive ? labels.active : labels.idle;

  if (timelineItems.length === 0) return null;

  return (
    <ChainOfThought
      open={isOpen}
      onOpenChange={setIsOpen}
      className="space-y-1"
    >
      <ChainOfThoughtHeader className="w-auto px-1 text-[13px] font-normal tracking-normal text-neutral-400 normal-case hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300">
        {headerLabel}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent className="mt-1 space-y-0 px-1 pb-1 pl-0">
        <div className="relative px-2 py-2.5">
          {timelineItems.length > 1 && (
            <div
              aria-hidden
              className="bg-hairline absolute top-3 bottom-4 left-[11px] w-0.5 dark:bg-neutral-800"
            />
          )}
          {timelineItems.map((item) => {
            if (item.type === "reasoning") {
              return (
                <AgentTimelineItem
                  key={item.key}
                  icon={
                    <Clock3 className="h-3 w-3" strokeWidth={2} aria-hidden />
                  }
                >
                  <MessageResponse className="text-[13px] leading-[1.65] text-neutral-500 dark:text-neutral-400">
                    {item.text}
                  </MessageResponse>
                </AgentTimelineItem>
              );
            }

            if (item.type === "tool") {
              return <AgentToolStep key={item.key} step={item.step} />;
            }

            return (
              <AgentTimelineItem
                key={item.key}
                icon={
                  <Check
                    className="h-3 w-3 text-emerald-500"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                }
              >
                <p className="pb-0 text-[13px] text-neutral-400 dark:text-neutral-500">
                  {labels.done}
                </p>
              </AgentTimelineItem>
            );
          })}
        </div>
      </ChainOfThoughtContent>
    </ChainOfThought>
  );
}
