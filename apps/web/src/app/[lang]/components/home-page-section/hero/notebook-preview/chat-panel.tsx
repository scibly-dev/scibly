"use client";

import { motion } from "framer-motion";
import { ArrowUp, Brain } from "lucide-react";
import { type Ref } from "react";

import {
  CORRECT_KEY,
  IDLE_KEY,
} from "@/app/[lang]/components/marketing-tokens";

import { BENTO_EASE } from "../../keyframes";
import {
  flatKey,
  pressableStyle,
  PREVIEW_META,
  PREVIEW_PLACEHOLDER,
} from "../hero-preview-kit";
import { type NotebookCopy } from "./notebook-copy";
import { ACCENT, EASE, PILLAR, RULE, SELECTED } from "./notebook-theme";
import { QuizCard } from "./quiz-card";
import { CitationChip } from "./source-glyphs";

export type DemoPhase = "quiz" | "thinking" | "followUp";

export function ChatPanel({
  t,
  selectedOption,
  phase,
  submitPulse,
  showCitations,
  optionTwoRef,
  submitRef,
}: {
  t: NotebookCopy;
  selectedOption: number;
  phase: DemoPhase;
  submitPulse: boolean;
  showCitations: boolean;
  optionTwoRef: Ref<HTMLDivElement>;
  submitRef: Ref<HTMLDivElement>;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <header
        className="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4"
        style={{ borderColor: RULE }}
      >
        <h3 className="text-ink m-0 truncate text-[14px] font-bold tracking-[-0.01em]">
          {t.chatTitle}
        </h3>
        <span
          className="hidden size-2 shrink-0 rounded-full sm:block"
          style={{ backgroundColor: CORRECT_KEY.edge }}
          aria-hidden
        />
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[430px] flex-1 flex-col px-3.5">
        {/* Newest turn sits on the composer, the way a real thread reads. The
            mask lets an older turn slide out of view instead of being sheared
            off by the top edge when the quiz claims the lower half. */}
        <div
          className="flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-hidden pt-3 pb-2"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0, #000 22px)",
            maskImage: "linear-gradient(to bottom, transparent 0, #000 22px)",
          }}
        >
          <div
            className="ml-auto max-w-[90%] shrink-0 rounded-[14px] border px-3.5 py-2 text-left text-[12.5px] leading-[1.5] font-semibold"
            style={{
              ...flatKey(SELECTED, 3),
              animation: `sc-rise 700ms ${BENTO_EASE} 180ms both`,
            }}
          >
            {t.userMessage}
          </div>

          <p
            className="m-0 max-w-[96%] shrink-0 text-left text-[12.5px] leading-[1.6] text-[#3b4574]"
            style={{ animation: `sc-rise 700ms ${BENTO_EASE} 260ms both` }}
          >
            {t.aiReply}
          </p>

          {/* The turn that swaps between quiz, thinking and follow-up. It is
              deliberately not height-reserved: the column is bottom-anchored,
              so the quiz arriving pushes the thread up under the top fade the
              way a real chat does, instead of leaving a hole while it waits. */}
          <div className="relative w-full shrink-0">
            {phase === "quiz" ? (
              <QuizCard
                t={t}
                selectedOption={selectedOption}
                submitPulse={submitPulse}
                optionTwoRef={optionTwoRef}
                submitRef={submitRef}
              />
            ) : (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-1.5 py-0.5">
                  {phase === "thinking" ? (
                    <ThinkingDots />
                  ) : (
                    <Brain
                      size={13}
                      strokeWidth={2.4}
                      className="shrink-0"
                      style={{ color: PILLAR.accentColor }}
                    />
                  )}
                  <span
                    className="text-[11.5px] font-semibold"
                    style={{ color: PREVIEW_META }}
                  >
                    {t.thinking}
                  </span>
                </div>

                {phase === "followUp" ? (
                  <motion.div
                    className="max-w-[96%] text-left"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <p className="m-0 text-[12.5px] leading-[1.6] text-[#3b4574]">
                      {t.aiFollowUp}
                    </p>
                    {showCitations ? (
                      <motion.div
                        className="mt-2.5 flex flex-wrap gap-1.5"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                      >
                        <CitationChip label={t.sourceOne} kind="pdf" />
                        <CitationChip label={t.sourceThree} kind="md" />
                      </motion.div>
                    ) : null}
                  </motion.div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 pt-1 pb-3.5">
          <div
            className="flex min-h-[46px] items-center gap-2 rounded-[16px] border py-1.5 pr-1.5 pl-3.5"
            style={flatKey(IDLE_KEY, 3)}
          >
            <span
              className="min-w-0 flex-1 truncate text-left text-[12.5px] font-medium"
              style={{ color: PREVIEW_PLACEHOLDER }}
            >
              {t.inputPlaceholder}
            </span>
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-[10px]"
              style={pressableStyle(ACCENT)}
            >
              <ArrowUp size={14} strokeWidth={2.8} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ThinkingDots() {
  return (
    <span className="flex items-center gap-1" aria-hidden>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-1.5 rounded-full"
          style={{ backgroundColor: PILLAR.lipColor }}
        />
      ))}
    </span>
  );
}
