"use client";

import Icon from "@scibly/ui/components/icon";
import { Loader2 } from "lucide-react";

import { getToolIconName, type GroupedToolStep } from "../utils/tool-helpers";
import { AgentTimelineItem } from "./agent-timeline-item";

function truncateHref(href: string, max = 56): string {
  if (href.length <= max) return href;
  return `${href.slice(0, max - 1)}…`;
}

interface AgentToolStepProps {
  step: GroupedToolStep;
}

export function AgentToolStep({ step }: AgentToolStepProps) {
  const { presentation, isDone, count, toolName } = step;
  const isActive = !isDone;

  return (
    <AgentTimelineItem
      icon={
        isActive ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          <Icon
            name={getToolIconName(toolName)}
            className="h-3 w-3"
            strokeWidth={2}
          />
        )
      }
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="text-[13px] leading-snug text-neutral-500 dark:text-neutral-400">
            {presentation.label}
          </p>
          {count > 1 && (
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
              ×{count}
            </span>
          )}
        </div>

        {presentation.context && (
          <p className="text-[12px] leading-relaxed text-neutral-400 dark:text-neutral-500">
            {presentation.context}
          </p>
        )}

        {presentation.contextHref && (
          <a
            href={presentation.contextHref}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[12px] leading-relaxed text-neutral-400 underline-offset-2 hover:text-neutral-500 hover:underline dark:text-neutral-500 dark:hover:text-neutral-400"
          >
            {truncateHref(presentation.contextHref)}
          </a>
        )}

        {presentation.detail?.split(" · ").map((line) => (
          <p
            key={line}
            className="text-[11px] leading-relaxed text-neutral-400 dark:text-neutral-500"
          >
            {line}
          </p>
        ))}
      </div>
    </AgentTimelineItem>
  );
}
