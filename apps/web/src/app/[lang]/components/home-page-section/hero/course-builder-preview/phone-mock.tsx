import { X } from "lucide-react";

import {
  IDLE_KEY,
  PRODUCT_INK,
} from "@/app/[lang]/components/marketing-tokens";

import { BENTO_EASE } from "../../keyframes";
import { flatKey, PREVIEW_META, previewWash } from "../hero-preview-kit";
import { type CourseBuilderCopy } from "./builder-copy";
import {
  ACCENT,
  type Breakpoint,
  PILLAR,
  RULE,
  showFromClass,
} from "./builder-theme";

export function PhoneMock({
  t,
  showBlock,
}: {
  t: CourseBuilderCopy;
  showBlock: boolean;
}) {
  return (
    <div
      className="relative flex h-full max-h-[300px] w-[148px] shrink-0 flex-col overflow-hidden border bg-white xl:max-h-[320px] xl:w-[160px]"
      style={{
        borderRadius: 16,
        aspectRatio: "393 / 852",
        borderColor: PRODUCT_INK,
        boxShadow:
          "0 1px 2px rgba(19,28,70,0.05), 0 14px 30px -22px rgba(19,28,70,0.3)",
      }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-4 justify-center xl:h-[18px]">
        <div className="bg-ink h-3.5 w-[42%] rounded-b-2xl xl:h-4" />
      </div>

      <div className="absolute inset-0 z-0 flex h-full w-full flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-1.5 px-2 pt-5 pb-1.5 xl:pt-6">
          <span
            className="flex size-5 shrink-0 items-center justify-center rounded-md"
            style={{ color: PREVIEW_META }}
          >
            <X size={11} strokeWidth={2.6} />
          </span>
          <div
            className="h-2 flex-1 overflow-hidden rounded-full"
            style={{ backgroundColor: previewWash(PILLAR, 70) }}
          >
            <div
              className="h-full w-[50%] rounded-full"
              style={{ backgroundColor: PILLAR.accentColor }}
            />
          </div>
          <span className="w-5 shrink-0" aria-hidden />
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-2">
          <div className="flex flex-col gap-1.5 pt-1">
            <p className="text-ink m-0 text-left text-[8.5px] leading-snug font-bold xl:text-[9.5px]">
              {t.heading}
            </p>
            {showBlock ? (
              <div style={{ animation: `sc-rise 620ms ${BENTO_EASE} both` }}>
                <LearnerOption label={t.optOne} />
                <LearnerOption label={t.optTwo} />
                <LearnerOption label={t.optThree} showFrom="xl" />
              </div>
            ) : (
              <div
                className="mt-2 rounded-[9px] border border-dashed px-2 py-3 text-center text-[8px] font-bold"
                style={{ borderColor: RULE, color: PREVIEW_META }}
              >
                …
              </div>
            )}
          </div>
        </div>

        <div
          className="mt-auto shrink-0 border-t bg-white px-2 pt-1.5 pb-2.5"
          style={{ borderColor: RULE }}
        >
          <div
            className="flex h-7 items-center justify-center rounded-[11px] border text-[8.5px] font-bold tracking-[0.08em] uppercase xl:h-8 xl:text-[9.5px]"
            style={flatKey(showBlock ? ACCENT : IDLE_KEY, 2)}
          >
            {t.checkAnswer}
          </div>
        </div>
      </div>
    </div>
  );
}

function LearnerOption({
  label,
  showFrom,
}: {
  label: string;
  showFrom?: Breakpoint;
}) {
  return (
    <div
      className={`mb-1 min-h-[1.7rem] items-center gap-1.5 rounded-[9px] border px-1.5 py-1 ${showFromClass(showFrom)}`}
      style={flatKey(IDLE_KEY, 2)}
    >
      <span
        className="size-2.5 shrink-0 rounded-[3px] border bg-white"
        style={{ borderColor: IDLE_KEY.edge }}
      />
      <span className="min-w-0 flex-1 truncate text-left text-[7.5px] leading-snug font-bold xl:text-[8.5px]">
        {label}
      </span>
    </div>
  );
}
