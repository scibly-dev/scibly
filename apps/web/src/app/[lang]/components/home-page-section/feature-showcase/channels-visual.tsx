import { cn } from "@scibly/ui/utils";
import { Check } from "lucide-react";
import Image from "next/image";

import {
  panelStyle,
  productColumnClass,
  productKeyClass,
  productLabelClass,
  productMetaClass,
  productPanelClass,
  productRootClass,
} from "@/app/[lang]/components/home-page-section/product-surface";
import {
  CORRECT_KEY,
  IDLE_KEY,
  keyStyle,
  panelKey,
  PILLARS,
} from "@/app/[lang]/components/marketing-tokens";
import { BrandLogo, TeamsLogo } from "@/components/brand-logo";
import { SCIBLY_MARK_SRC } from "@/lib/marketing-assets";

import { BENTO_EASE } from "../keyframes";
import { type FeatureShowcaseDictionary } from "./i18n/feature-showcase.types";

type ChannelsCopy = FeatureShowcaseDictionary["channels"];
type Platform = "slack" | "teams";

const PILLAR = PILLARS.channels;

const AVATARS = {
  mia: "#e01e5a",
  jonas: "#2bac76",
} as const;

export function ChannelsVisual({ t }: { t: ChannelsCopy }) {
  return (
    <div data-bento-visual className={productRootClass}>
      <div className={cn(productColumnClass, "justify-center gap-3")}>
        <ChannelThread t={t} platform="slack" />
      </div>
    </div>
  );
}

export function ChannelsDetailStage({ t }: { t: ChannelsCopy }) {
  return (
    <div className="grid items-stretch gap-4 lg:grid-cols-2 lg:gap-6">
      <ChannelPanel delay="200ms">
        <ChannelThread t={t} platform="slack" />
      </ChannelPanel>
      {/* Teams — large screens only; phone and tablet stay Slack-focused */}
      <div className="hidden lg:block">
        <ChannelPanel delay="360ms">
          <ChannelThread t={t} platform="teams" />
        </ChannelPanel>
      </div>
    </div>
  );
}

function ChannelPanel({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: string;
}) {
  return (
    <div
      data-bento-anim
      className={cn(productPanelClass, "gap-3")}
      style={panelStyle(PILLAR, delay)}
    >
      {children}
    </div>
  );
}

function ChannelThread({
  t,
  platform,
}: {
  t: ChannelsCopy;
  platform: Platform;
}) {
  return (
    <>
      <div
        data-bento-anim
        className="flex shrink-0 items-center gap-2.5"
        style={{ animation: `sc-fade-in 650ms ${BENTO_EASE} 380ms both` }}
      >
        {platform === "slack" ? (
          <BrandLogo domain="slack.com" alt="Slack" size={18} />
        ) : (
          <TeamsLogo size={18} />
        )}
        <span className={cn(productLabelClass, "min-w-0 flex-1 truncate")}>
          {platform === "slack" ? `#${t.channel}` : t.channel}
        </span>
        <span className="text-ink-soft shrink-0 text-[11px] font-bold tracking-wide uppercase">
          {platform === "slack" ? "Slack" : "Teams"}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-end gap-2.5 overflow-hidden opacity-60">
        <ColleagueMessage
          author={t.chat1Author}
          text={t.chat1Text}
          time="10:41"
          color={AVATARS.mia}
          delay="520ms"
        />
        <ColleagueMessage
          author={t.chat2Author}
          text={t.chat2Text}
          time="10:42"
          color={AVATARS.jonas}
          delay="680ms"
        />
      </div>

      <LessonCard t={t} />
    </>
  );
}

function ColleagueMessage({
  author,
  text,
  time,
  color,
  delay,
}: {
  author: string;
  text: string;
  time: string;
  color: string;
  delay: string;
}) {
  return (
    <div
      data-bento-anim
      className="flex shrink-0 gap-2.5"
      style={{ animation: `sc-in 700ms ${BENTO_EASE} ${delay} both` }}
    >
      <span
        className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-bold text-white"
        style={{ backgroundColor: color }}
        aria-hidden
      >
        {author.slice(0, 1)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="text-ink text-[13.5px] font-bold">{author}</span>
          <span className="text-ink-soft text-[11.5px]">{time}</span>
        </span>
        <span className="block text-[13.5px] leading-[1.45] text-[#3b4574]">
          {text}
        </span>
      </span>
    </div>
  );
}

function LessonCard({ t }: { t: ChannelsCopy }) {
  return (
    <div
      data-bento-anim
      className="flex shrink-0 flex-col gap-3 rounded-[16px] border-2 px-4 py-3.5"
      style={{
        ...keyStyle(panelKey(PILLAR)),
        animation: `sc-catch 900ms ${BENTO_EASE} 920ms both`,
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[10px]"
          style={{ backgroundColor: PILLAR.softColor }}
        >
          <Image src={SCIBLY_MARK_SRC} alt="" width={18} height={18} />
        </span>
        <span className="text-ink truncate text-[15.5px] font-bold">
          {t.botName}
        </span>
        <span
          className="shrink-0 rounded-[5px] px-1.5 py-0.5 text-[10.5px] font-bold tracking-wide uppercase"
          style={{
            backgroundColor: PILLAR.softColor,
            color: PILLAR.accentColor,
          }}
        >
          App
        </span>
        <span className="text-ink-soft ml-auto shrink-0 text-[11.5px]">
          10:43
        </span>
      </div>

      <div className={cn(productMetaClass, "-mt-1.5")}>{t.lessonLabel}</div>

      <div className="text-ink text-[16px] leading-[1.35] font-semibold tracking-[-0.012em]">
        {t.quizQ}
      </div>

      <div className="flex flex-col gap-2.5">
        <QuizOption label={t.optCorrect} correct delay="1240ms" />
        <QuizOption label={t.optWrong} correct={false} delay="1340ms" />
      </div>

      <div
        data-bento-anim
        className="flex items-center gap-2 text-[12.5px] font-bold"
        style={{
          color: CORRECT_KEY.ink,
          animation: `sc-fade-in 650ms ${BENTO_EASE} 1480ms both`,
        }}
      >
        <Check size={13} strokeWidth={3} aria-hidden />
        {t.correct}
      </div>
    </div>
  );
}

function QuizOption({
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
      className={productKeyClass}
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
