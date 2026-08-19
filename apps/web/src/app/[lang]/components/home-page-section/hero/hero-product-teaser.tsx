"use client";

import { lazy, Suspense } from "react";

import { lipShadow, tint } from "@/app/[lang]/components/marketing-tokens";

import { PREVIEW_STAGE_HEIGHT } from "./hero-preview-stage";
import { type HeroDictionary } from "./i18n/hero.types";
import {
  type ProductPreviewTab,
  WORKSPACE_PILLARS,
} from "./product-preview-modes";

const NotebookPreview = lazy(async () => {
  const previewModule = await import("./notebook-preview");
  return { default: previewModule.HeroNotebookPreview };
});

const CourseBuilderPreview = lazy(async () => {
  const previewModule = await import("./course-builder-preview");
  return { default: previewModule.HeroCourseBuilderPreview };
});

const GamificationPreview = lazy(async () => {
  const previewModule = await import("./gamification-preview");
  return { default: previewModule.HeroGamificationPreview };
});

interface HeroProductTeaserProps {
  t: HeroDictionary;
  tab: ProductPreviewTab;
  ready: boolean;
}

export function HeroProductTeaser({ t, tab, ready }: HeroProductTeaserProps) {
  const pillar = WORKSPACE_PILLARS[tab];
  const fallback = (
    <div
      className={`bg-white ${PREVIEW_STAGE_HEIGHT}`}
      data-preview-fallback={tab}
      aria-hidden
    />
  );

  return (
    <div
      className="relative w-full overflow-hidden rounded-[18px] border-2 bg-white md:rounded-[22px]"
      style={{
        borderColor: tint(pillar.softColor, 65),
        boxShadow: `${lipShadow(tint(pillar.lipColor, 55), 3)}, 0 18px 40px -30px rgba(15,35,61,0.45)`,
      }}
    >
      <div
        className="relative overflow-hidden"
        aria-busy={!ready}
        data-active-preview={tab}
      >
        {ready ? (
          <Suspense fallback={fallback}>{activePreview(t, tab)}</Suspense>
        ) : (
          fallback
        )}
      </div>
    </div>
  );
}

function activePreview(t: HeroDictionary, tab: ProductPreviewTab) {
  switch (tab) {
    case "courseBuilder":
      return <CourseBuilderPreview t={t.courseBuilder} />;
    case "gamification":
      return <GamificationPreview t={t.gamification} />;
    case "notebook":
      return <NotebookPreview t={t.notebook} />;
  }
}
