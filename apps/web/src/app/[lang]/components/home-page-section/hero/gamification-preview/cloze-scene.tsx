import { RotateCcw } from "lucide-react";

import {
  CORRECT_KEY,
  IDLE_KEY,
} from "@/app/[lang]/components/marketing-tokens";

import {
  flatKey,
  PREVIEW_META,
  PREVIEW_PLACEHOLDER,
  previewTrayStyle,
  previewWash,
} from "../hero-preview-kit";
import { PerfectFeedbackBanner } from "./feedback-banner";
import { type GamificationCopy } from "./gamification-copy";
import { PILLAR } from "./gamification-theme";
import { SceneCard } from "./scene-card";

export function ClozeScene({ t }: { t: GamificationCopy }) {
  return (
    <SceneCard size="hero" progress={62}>
      <div className="relative px-3 pt-1 pb-2 text-left md:px-3.5 md:pt-1.5 md:pb-2.5">
        <p className="text-ink mb-1 text-[11.5px] leading-snug font-bold md:mb-1.5 md:text-[12.5px]">
          {t.clozePrompt}
        </p>

        <p className="m-0 text-[11.5px] leading-[1.75] text-[#3b4574] md:text-[12.5px] md:leading-[1.9]">
          {t.clozeBefore} <ClozeChip label={t.clozeGapOne} /> {t.clozeMid}{" "}
          <ClozeChip label={t.clozeGapTwo} /> {t.clozeAfter}
        </p>

        <div className="mt-2 md:mt-2.5">
          <div className="mb-1 flex items-center justify-between gap-2">
            <span
              className="text-[9.5px] font-semibold"
              style={{ color: PREVIEW_META }}
            >
              {t.clozeBankLabel}
            </span>
            <span
              className="inline-flex items-center gap-0.5 text-[9.5px] font-semibold"
              style={{ color: PREVIEW_META }}
            >
              <RotateCcw size={9} strokeWidth={2.6} />
              {t.clozeReset}
            </span>
          </div>
          <div
            className="flex min-w-0 flex-wrap items-center gap-1 rounded-[12px] border p-1 md:p-1.5"
            style={previewTrayStyle(PILLAR)}
          >
            {/* The two gaps the learner already emptied out of the bank. */}
            <span
              className="inline-flex h-[1.45rem] min-w-[3.25rem] rounded-[9px] md:h-[1.55rem]"
              style={{ backgroundColor: previewWash(PILLAR, 75) }}
              aria-hidden
            />
            <span
              className="inline-flex h-[1.45rem] min-w-[3.25rem] rounded-[9px] md:h-[1.55rem]"
              style={{ backgroundColor: previewWash(PILLAR, 75) }}
              aria-hidden
            />
            {t.clozeBank.map((word) => (
              <span
                key={word}
                className="inline-flex max-w-full items-center rounded-[9px] border px-2 py-1 text-[10px] leading-snug font-bold whitespace-nowrap select-none"
                style={flatKey({ ...IDLE_KEY, ink: PREVIEW_PLACEHOLDER }, 2)}
              >
                <span className="truncate">{word}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <PerfectFeedbackBanner t={t} />
    </SceneCard>
  );
}

function ClozeChip({ label }: { label: string }) {
  return (
    <span
      className="inline-flex max-w-full items-center rounded-[9px] border px-2 py-0.5 text-[10.5px] leading-snug font-bold whitespace-nowrap select-none"
      style={flatKey(CORRECT_KEY, 2)}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}
