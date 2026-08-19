"use client";

import { HeroPreviewStage } from "../hero-preview-stage";
import { type GamificationCopy } from "./gamification-copy";
import { GamificationHeader } from "./gamification-header";
import { PathRail } from "./path-rail";
import { PracticeCanvas } from "./practice-canvas";
import { SceneTypeStrip } from "./scene-type-strip";

export function HeroGamificationPreview({ t }: { t: GamificationCopy }) {
  return (
    <HeroPreviewStage>
      <GamificationHeader t={t} />
      <SceneTypeStrip t={t} />

      <div className="flex min-h-0 flex-1 items-stretch overflow-hidden">
        <PathRail t={t} />
        <PracticeCanvas t={t} />
      </div>
    </HeroPreviewStage>
  );
}
