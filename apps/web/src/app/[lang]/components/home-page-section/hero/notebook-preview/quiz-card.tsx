"use client";

import { cn } from "@scibly/ui/utils";
import { motion } from "framer-motion";
import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { type Ref } from "react";

import { IDLE_KEY } from "@/app/[lang]/components/marketing-tokens";

import { BENTO_EASE } from "../../keyframes";
import { flatKey, pressableStyle, previewCardStyle } from "../hero-preview-kit";
import { type NotebookCopy } from "./notebook-copy";
import { ACCENT, EASE, PILLAR, RULE, SELECTED } from "./notebook-theme";

export function QuizCard({
  t,
  selectedOption,
  submitPulse,
  optionTwoRef,
  submitRef,
}: {
  t: NotebookCopy;
  selectedOption: number;
  submitPulse: boolean;
  optionTwoRef: Ref<HTMLDivElement>;
  submitRef: Ref<HTMLDivElement>;
}) {
  return (
    <div
      className="relative z-[2] w-full overflow-hidden rounded-[16px] border"
      style={{
        ...previewCardStyle(PILLAR),
        animation: `sc-rise 750ms ${BENTO_EASE} 340ms both`,
      }}
    >
      <div
        className="flex items-start justify-between gap-2 border-b px-3 py-2.5"
        style={{ borderColor: RULE }}
      >
        <p className="text-ink m-0 text-[12.5px] leading-snug font-bold">
          {t.questionTitle}
        </p>
        <div
          className="flex shrink-0 items-center gap-px rounded-full border px-1.5 py-0.5"
          style={flatKey(IDLE_KEY, 2)}
        >
          <ChevronLeft size={10} strokeWidth={2.6} />
          <span className="text-[9.5px] font-bold">{t.questionStep}</span>
          <ChevronRight size={10} strokeWidth={2.6} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 px-2.5 py-2.5">
        <McOption label={t.optBeginner} selected={selectedOption === 0} />
        <McOption
          ref={optionTwoRef}
          label={t.optAdvanced}
          selected={selectedOption === 1}
        />
        <McOption
          label={t.optMixed}
          selected={selectedOption === 2}
          className="hidden sm:flex"
        />
      </div>

      <div
        className="flex items-center justify-between border-t px-3 py-2"
        style={{ borderColor: RULE }}
      >
        <span
          className="rounded-[10px] border px-2.5 py-1 text-[10.5px] font-bold"
          style={pressableStyle(IDLE_KEY, 2)}
        >
          {t.skip}
        </span>
        <motion.div
          ref={submitRef}
          className="flex size-8 items-center justify-center rounded-[10px]"
          style={pressableStyle(ACCENT)}
          animate={submitPulse ? { scale: [1, 0.9, 1.06, 1] } : { scale: 1 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <ArrowRight size={13} strokeWidth={2.8} />
        </motion.div>
      </div>
    </div>
  );
}

function McOption({
  label,
  selected,
  className,
  ref,
}: {
  label: string;
  selected?: boolean;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-[34px] items-center gap-2.5 rounded-[11px] border px-2.5 py-1.5 text-[12px] leading-snug font-bold",
        "transition-[background-color,border-color,box-shadow,color] duration-300",
        className,
      )}
      style={flatKey(selected ? SELECTED : IDLE_KEY, 3)}
    >
      <span
        className="flex size-[16px] shrink-0 items-center justify-center rounded-[5px] border transition-colors duration-300"
        style={
          selected
            ? {
                backgroundColor: PILLAR.accentColor,
                borderColor: PILLAR.accentColor,
                color: "#ffffff",
              }
            : { backgroundColor: "#ffffff", borderColor: IDLE_KEY.edge }
        }
      >
        {selected ? <Check size={10} strokeWidth={3.5} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </div>
  );
}
