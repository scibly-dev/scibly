import { Flame, Trophy } from "lucide-react";

import {
  CORRECT_KEY,
  NOTICE_KEY,
} from "@/app/[lang]/components/marketing-tokens";

import { flatKey, PREVIEW_META, previewWash } from "../hero-preview-kit";
import { type GamificationCopy } from "./gamification-copy";
import { PILLAR, RULE, SCENE_PERCENT } from "./gamification-theme";

export function GamificationHeader({ t }: { t: GamificationCopy }) {
  return (
    <div
      className="flex shrink-0 flex-col gap-2 border-b px-4 pt-3 pb-2.5 sm:gap-2.5 sm:px-5 sm:pt-3.5 sm:pb-3 md:pt-4 md:pb-3.5"
      style={{ borderColor: RULE }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className="m-0 text-[10.5px] font-semibold"
            style={{ color: PREVIEW_META }}
          >
            {t.lessonProgress}
          </p>
          <h3 className="text-ink m-0 mt-1 truncate text-[16px] font-bold tracking-[-0.015em] md:text-[17px]">
            {t.courseTitle}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-bold"
            style={flatKey(NOTICE_KEY, 2)}
          >
            <Trophy size={11} strokeWidth={2.6} />
            {t.comboChip}
          </span>
          <span
            className="hidden items-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-bold sm:inline-flex"
            style={flatKey(CORRECT_KEY, 2)}
          >
            <Flame size={11} strokeWidth={2.6} />
            {t.streakChip}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className="shrink-0 text-[10.5px] font-semibold"
          style={{ color: PREVIEW_META }}
        >
          {t.sceneProgress}
        </span>
        <div
          className="h-2 min-w-0 flex-1 overflow-hidden rounded-full"
          style={{ backgroundColor: previewWash(PILLAR, 70) }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${SCENE_PERCENT}%`,
              backgroundColor: PILLAR.accentColor,
            }}
          />
        </div>
        <span
          className="shrink-0 text-[10.5px] font-bold tabular-nums"
          style={{ color: PILLAR.accentColor }}
        >
          {SCENE_PERCENT}%
        </span>
      </div>
    </div>
  );
}
