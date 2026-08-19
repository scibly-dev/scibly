"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { Button } from "@scibly/ui/components/button";
import { Sparkles } from "lucide-react";

import { useNotebookState } from "../../chat/runtime/context";
import { agentFollowOffer } from "../agent-activity";
import { useCourseBuilderStore } from "../course-builder-store";

export function AgentFollowBanner({ t }: { t: NotebookTranslations }) {
  const isFollowingAgent = useCourseBuilderStore(
    (state) => state.isFollowingAgent,
  );
  const agentTarget = useCourseBuilderStore((state) => state.agentTarget);
  const followAgent = useCourseBuilderStore((state) => state.followAgent);
  const { status } = useNotebookState();

  const offer = agentFollowOffer({
    isFollowingAgent,
    agentTarget,
    chatStatus: status,
  });
  if (!offer) return null;

  const cb = t.studio.courseBuilder;
  const where =
    offer.scene?.title ?? offer.lesson?.title ?? offer.course?.title;

  return (
    <div className="flex items-center justify-between gap-3 border-b-2 border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/40 dark:bg-emerald-950/30">
      <p className="flex min-w-0 items-center gap-2 text-[12.5px] text-emerald-950 dark:text-emerald-100">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {cb.agentWorkingOn.replace("{{target}}", where ?? "")}
        </span>
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 shrink-0 text-xs"
        onClick={followAgent}
      >
        {cb.followAgent}
      </Button>
    </div>
  );
}
