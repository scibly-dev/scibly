import { Check, ChevronLeft, Sparkles } from "lucide-react";

import {
  CORRECT_KEY,
  DONE_KEY,
  IDLE_KEY,
  NOTICE_KEY,
  tint,
} from "@/app/[lang]/components/marketing-tokens";

import { BENTO_EASE } from "../../keyframes";
import { flatKey } from "../hero-preview-kit";
import { type GamificationCopy } from "./gamification-copy";

export function PerfectFeedbackBanner({ t }: { t: GamificationCopy }) {
  return (
    <div
      className="flex flex-col gap-1.5 border-t px-3.5 pt-2 pb-2 md:gap-2.5 md:px-4 md:pt-3 md:pb-3.5"
      style={{
        backgroundColor: tint(CORRECT_KEY.face, 52),
        borderColor: tint(CORRECT_KEY.edge, 30),
      }}
    >
      <div className="flex items-center gap-2.5 md:gap-3">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full md:size-9"
          style={{ backgroundColor: CORRECT_KEY.edge }}
        >
          <Check className="size-3.5 stroke-[3] text-white md:size-4" />
        </div>
        <p
          className="m-0 min-w-0 flex-1 truncate text-[16px] leading-tight font-extrabold tracking-[-0.015em] md:text-[18px]"
          style={{ color: CORRECT_KEY.ink }}
        >
          {t.feedback}
        </p>
        <div
          className="hidden shrink-0 sm:block"
          style={{ animation: `sc-rise 700ms ${BENTO_EASE} 380ms both` }}
        >
          <SpEarnBadge spValue={t.spValue} earnedLabel={t.earnedLabel} />
        </div>
      </div>

      <div className="flex items-stretch gap-2 md:gap-2.5">
        <div
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-[12px] border px-3 text-[11.5px] font-bold md:h-9 md:rounded-[13px]"
          style={flatKey(IDLE_KEY, 3)}
        >
          <ChevronLeft className="size-3.5 opacity-70" aria-hidden />
          {t.backLabel}
        </div>
        <div
          className="flex h-8 min-w-0 flex-1 items-center justify-center rounded-[12px] border text-[11px] font-bold tracking-[0.12em] uppercase md:h-9 md:rounded-[13px]"
          style={flatKey(DONE_KEY, 3)}
        >
          {t.finishLabel}
        </div>
      </div>
    </div>
  );
}

function SpEarnBadge({
  spValue,
  earnedLabel,
}: {
  spValue: string;
  earnedLabel: string;
}) {
  return (
    <div
      className="relative flex items-center gap-2 rounded-full border px-2.5 py-1.5"
      style={flatKey(NOTICE_KEY, 3)}
    >
      <div
        className="flex size-7 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: NOTICE_KEY.edge }}
      >
        <Sparkles className="size-3.5 text-white" strokeWidth={2.6} />
      </div>
      <div className="flex flex-col pr-0.5">
        <div className="flex items-baseline gap-0.5">
          <span className="text-[15px] font-bold tracking-tight">
            {spValue}
          </span>
          <span className="text-[10px] font-bold tracking-tight">SP</span>
        </div>
        <span className="text-[7px] font-bold tracking-[0.2em] uppercase opacity-70">
          {earnedLabel}
        </span>
      </div>
    </div>
  );
}
