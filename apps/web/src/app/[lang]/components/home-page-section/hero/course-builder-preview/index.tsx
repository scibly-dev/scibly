"use client";

import { useState } from "react";

import { usePrefersReducedMotion } from "@/components/in-view-reveal";
import { useDemoTimeline } from "@/components/use-demo-timeline";

import { HeroPreviewStage } from "../hero-preview-stage";
import { type SlashCommandId } from "../i18n/hero.types";
import { AuthorCanvas, type CanvasPhase } from "./author-canvas";
import { type CourseBuilderCopy } from "./builder-copy";
import { CourseHeader, LessonTabs } from "./course-header";
import { PreviewSidebar } from "./preview-sidebar";
import { SceneList } from "./scene-list";
import { typingDurationMs } from "./typed-paragraph";

const SELECTION_WALK: SlashCommandId[] = [
  "hint",
  "flashcard",
  "character",
  "input",
  "multipleChoice",
];

const SLASH_MS = 700;
const MENU_OPEN_MS = 500;
const WALK_STEP_MS = 420;
const INSERT_MS = 700;
const HOLD_MS = 2400;

export function HeroCourseBuilderPreview({ t }: { t: CourseBuilderCopy }) {
  const { phase, activeId, loopKey } = useSlashInsertSequence(
    t.bodyParagraph.length,
  );

  return (
    <HeroPreviewStage>
      <CourseHeader t={t} />
      <LessonTabs t={t} />
      <div className="flex min-h-0 flex-1 items-stretch overflow-hidden">
        <SceneList t={t} />
        <AuthorCanvas
          t={t}
          phase={phase}
          activeId={activeId}
          loopKey={loopKey}
        />
        <PreviewSidebar t={t} showBlock={phase === "inserted"} />
      </div>
    </HeroPreviewStage>
  );
}

function useSlashInsertSequence(bodyLength: number) {
  const reduceMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<CanvasPhase>("hint");
  const [activeId, setActiveId] = useState<SlashCommandId | null>(null);
  const [loopKey, setLoopKey] = useState(0);

  useDemoTimeline(!reduceMotion, async (wait) => {
    for (;;) {
      setPhase("hint");
      setActiveId(null);
      setLoopKey((key) => key + 1);

      await wait(SLASH_MS);
      setPhase("slash");

      await wait(MENU_OPEN_MS);
      setPhase("menu");
      setActiveId(SELECTION_WALK[0]);

      for (const id of SELECTION_WALK.slice(1)) {
        await wait(WALK_STEP_MS);
        setActiveId(id);
      }

      await wait(INSERT_MS);
      setPhase("inserted");
      setActiveId(null);

      await wait(typingDurationMs(bodyLength) + HOLD_MS);
    }
  });

  if (reduceMotion) {
    return { phase: "inserted" as const, activeId: null, loopKey };
  }

  return { phase, activeId, loopKey };
}
