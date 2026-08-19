import { cn } from "@scibly/ui/utils";
import { Check, Flame, RotateCcw, Trophy, Zap } from "lucide-react";

import {
  panelStyle,
  productColumnClass,
  productLabelClass,
  productPanelClass,
  productRootClass,
} from "@/app/[lang]/components/home-page-section/product-surface";
import {
  CORRECT_KEY,
  IDLE_KEY,
  keyStyle,
  NOTICE_KEY,
  PILLARS,
} from "@/app/[lang]/components/marketing-tokens";

import { BENTO_EASE } from "../keyframes";
import { type FeatureShowcaseDictionary } from "./i18n/feature-showcase.types";

type LearnerCopy = FeatureShowcaseDictionary["learner"];

const PILLAR = PILLARS.learner;

const LEVEL_PROGRESS = "68%";

export function LearnerVisual({ t }: { t: LearnerCopy }) {
  return (
    <div data-bento-visual className={productRootClass}>
      <div className={cn(productColumnClass, "justify-center gap-3")}>
        <ChallengeScene t={t} />
      </div>
    </div>
  );
}

export function LearnerDetailStage({ t }: { t: LearnerCopy }) {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-12 lg:gap-6">
      <LearnerPanel delay="200ms" className="gap-3 lg:col-span-7">
        <ChallengeScene t={t} showContinue />
      </LearnerPanel>

      {/* Cloze + progress — large screens only; phone and tablet stay focused */}
      <div className="hidden gap-4 lg:col-span-5 lg:grid lg:min-h-[440px] lg:grid-rows-2 lg:gap-6">
        <LearnerPanel delay="320ms" className="gap-3">
          <ClozeScene t={t} />
        </LearnerPanel>
        <LearnerPanel delay="420ms" className="justify-center gap-5">
          <ProgressScene t={t} />
        </LearnerPanel>
      </div>
    </div>
  );
}

function LearnerPanel({
  children,
  delay,
  className,
}: {
  children: React.ReactNode;
  delay: string;
  className: string;
}) {
  return (
    <div
      data-bento-anim
      className={cn(productPanelClass, className)}
      style={panelStyle(PILLAR, delay)}
    >
      {children}
    </div>
  );
}

function ChallengeScene({
  t,
  showContinue = false,
}: {
  t: LearnerCopy;
  showContinue?: boolean;
}) {
  return (
    <>
      <div
        data-bento-anim
        className="flex shrink-0 items-center justify-between gap-3"
        style={{ animation: `sc-fade-in 600ms ${BENTO_EASE} 380ms both` }}
      >
        <span className={productLabelClass}>{t.stageLabel}</span>
        <span
          className="flex shrink-0 items-center gap-1.5 rounded-[10px] border-2 px-2.5 py-1 text-[12.5px] font-bold"
          style={keyStyle(NOTICE_KEY, 3)}
        >
          <Zap size={13} className="fill-current" aria-hidden />
          {t.comboLabel}
        </span>
      </div>

      <p
        data-bento-anim
        className="text-ink m-0 shrink-0 text-[17px] leading-[1.3] font-semibold tracking-[-0.015em]"
        style={{ animation: `sc-rise 750ms ${BENTO_EASE} 480ms both` }}
      >
        {t.question}
      </p>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-2.5">
        <AnswerKey label={t.optA} correct delay="640ms" />
        <AnswerKey label={t.optB} correct={false} delay="740ms" />
        <AnswerKey label={t.optC} correct={false} delay="840ms" />
      </div>

      <div
        data-bento-anim
        className="flex shrink-0 items-center gap-2.5"
        style={{ animation: `sc-rise 700ms ${BENTO_EASE} 1020ms both` }}
      >
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-white"
          style={{
            backgroundColor: CORRECT_KEY.edge,
            boxShadow: `0 2px 0 0 ${CORRECT_KEY.lip}`,
          }}
          aria-hidden
        >
          <Check size={15} strokeWidth={3} />
        </span>
        <span
          className="text-[16px] font-bold"
          style={{ color: CORRECT_KEY.ink }}
        >
          {t.feedback}
        </span>
        <span
          className="ml-auto shrink-0 rounded-[9px] border-2 px-2.5 py-1 text-[12.5px] font-bold"
          style={keyStyle(NOTICE_KEY, 3)}
        >
          {t.spValue} {t.earnedLabel}
        </span>
      </div>

      {showContinue ? (
        <div
          data-bento-anim
          className="flex h-11 shrink-0 items-center justify-center rounded-[14px] text-[12px] font-bold tracking-[0.12em] text-white uppercase"
          style={{
            backgroundColor: CORRECT_KEY.edge,
            boxShadow: `0 4px 0 0 ${CORRECT_KEY.lip}`,
            animation: `sc-rise 700ms ${BENTO_EASE} 1140ms both`,
          }}
        >
          {t.nextLabel}
        </div>
      ) : (
        <LevelBar t={t} />
      )}
    </>
  );
}

function AnswerKey({
  label,
  correct,
  delay,
}: {
  label: string;
  correct: boolean;
  delay: string;
}) {
  return (
    <div
      data-bento-anim
      className="flex items-center gap-3 rounded-[13px] border-2 px-3.5 py-2.5 text-[14.5px] leading-snug font-bold"
      style={{
        ...keyStyle(correct ? CORRECT_KEY : IDLE_KEY),
        animation: `sc-rise 700ms ${BENTO_EASE} ${delay} both`,
      }}
    >
      {correct ? (
        <Check size={17} strokeWidth={3} className="shrink-0" aria-hidden />
      ) : (
        <span
          className="size-[17px] shrink-0 rounded-full border-2 border-[#dcdfe7]"
          aria-hidden
        />
      )}
      <span className="min-w-0 flex-1">{label}</span>
    </div>
  );
}

function LevelBar({ t }: { t: LearnerCopy }) {
  return (
    <div
      data-bento-anim
      className="flex shrink-0 items-center gap-3"
      style={{ animation: `sc-fade-in 650ms ${BENTO_EASE} 1120ms both` }}
    >
      <span className="h-[9px] flex-1 overflow-hidden rounded-[5px] bg-[#e6eaf5]">
        <span
          data-bento-anim
          className="block h-full origin-left rounded-[5px]"
          style={{
            width: LEVEL_PROGRESS,
            backgroundColor: CORRECT_KEY.edge,
            animation: `sc-xp-fill 900ms ${BENTO_EASE} 1200ms both`,
          }}
        />
      </span>
      <span className="text-ink-soft shrink-0 text-[12.5px] font-bold whitespace-nowrap">
        {t.levelValue}
      </span>
    </div>
  );
}

function ClozeScene({ t }: { t: LearnerCopy }) {
  return (
    <>
      <span className={cn(productLabelClass, "shrink-0")}>
        {t.clozeBankLabel}
      </span>

      <p className="text-ink m-0 text-[13.5px] leading-[2] font-medium">
        {t.clozeBefore}{" "}
        <span
          className="inline-block rounded-[9px] border-2 px-2.5 py-1 text-[12.5px] font-bold"
          style={keyStyle(CORRECT_KEY, 3)}
        >
          {t.clozeGapOne}
        </span>{" "}
        {t.clozeMid}{" "}
        <span
          className="inline-block rounded-[9px] border-2 border-dashed border-[#c4c4c4] bg-[#ececec] px-5 py-1 text-[12.5px] shadow-[inset_0_2px_5px_rgba(0,0,0,0.09)]"
          aria-hidden
        >
          &nbsp;
        </span>{" "}
        {t.clozeAfter}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-2">
        {[t.clozeGapTwo, ...t.clozeBank].map((word) => (
          <span
            key={word}
            className="rounded-[10px] border-2 px-3 py-1.5 text-[12.5px] font-bold"
            style={keyStyle(IDLE_KEY, 3)}
          >
            {word}
          </span>
        ))}
        <span className="text-ink-soft ml-auto flex items-center gap-1 text-[12px] font-semibold">
          <RotateCcw size={11} strokeWidth={2.5} aria-hidden />
          {t.clozeReset}
        </span>
      </div>
    </>
  );
}

function ProgressScene({ t }: { t: LearnerCopy }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-[12px]"
          style={{
            backgroundColor: NOTICE_KEY.face,
            color: NOTICE_KEY.ink,
            boxShadow: `0 3px 0 0 ${NOTICE_KEY.lip}`,
          }}
          aria-hidden
        >
          <Flame size={18} strokeWidth={2.4} />
        </span>
        <span className="min-w-0">
          <span className="text-ink block truncate text-[15.5px] font-bold">
            {t.streakValue}
          </span>
          <span className="text-ink-soft block truncate text-[12.5px]">
            {t.streakLabel}
          </span>
        </span>
      </div>

      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-[12px]"
          style={{
            backgroundColor: PILLAR.softColor,
            color: PILLAR.accentColor,
            boxShadow: `0 3px 0 0 ${PILLAR.lipColor}`,
          }}
          aria-hidden
        >
          <Trophy size={18} strokeWidth={2.4} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="mb-2 flex items-baseline justify-between gap-2">
            <span className="text-ink truncate text-[15.5px] font-bold">
              {t.levelValue}
            </span>
            <span className="text-ink-soft shrink-0 text-[12.5px]">
              {t.levelLabel}
            </span>
          </span>
          <span className="block h-[9px] overflow-hidden rounded-[5px] bg-[#e6eaf5]">
            <span
              data-bento-anim
              className="block h-full origin-left rounded-[5px]"
              style={{
                width: LEVEL_PROGRESS,
                backgroundColor: CORRECT_KEY.edge,
                animation: `sc-xp-fill 900ms ${BENTO_EASE} 900ms both`,
              }}
            />
          </span>
          <span className="text-ink-soft mt-1.5 block text-[12px] font-semibold">
            {t.xpLabel}
          </span>
        </span>
      </div>
    </>
  );
}
