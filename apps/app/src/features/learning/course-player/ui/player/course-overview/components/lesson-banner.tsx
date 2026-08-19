"use client";

import type { LearningPlayerTranslations } from "../../i18n/learning-player.types";
import type { PlayerLesson } from "../../utils/player-types";

import { motion } from "framer-motion";
import { Check, Lock } from "lucide-react";

import { LessonIconGlyph } from "@/shared/content/course/components/lesson-icon-glyph";

import { COURSE_HIGHLIGHT } from "../course-path-theme";

interface LessonBannerProps {
  lesson: PlayerLesson;
  index: number;
  totalLessons: number;
  isCompleted: boolean;
  isLocked: boolean;
  completedScenes: number;
  totalScenes: number;

  revealed?: boolean;
  onStart: () => void;
  onRevealComplete?: () => void;
  t: LearningPlayerTranslations;
}

const BANNER_LIP_PX = 6;

function bannerTone(props: LessonBannerProps) {
  if (props.isLocked) {
    return { face: COURSE_HIGHLIGHT.locked, lip: COURSE_HIGHLIGHT.lockedLip };
  }
  return props.isCompleted
    ? { face: COURSE_HIGHLIGHT.completed, lip: COURSE_HIGHLIGHT.completedLip }
    : { face: COURSE_HIGHLIGHT.nextFace, lip: COURSE_HIGHLIGHT.nextLip };
}

function bannerMeta(props: LessonBannerProps) {
  const minutes = props.lesson.estimatedTimeToCompleteMinutes ?? 0;
  return [
    props.t.overview.lessonProgress
      .replace("{{current}}", String(props.index + 1))
      .replace("{{total}}", String(props.totalLessons)),
    props.totalScenes > 0
      ? props.t.overview.sceneProgress
          .replace("{{completed}}", String(props.completedScenes))
          .replace("{{total}}", String(props.totalScenes))
      : null,
    minutes > 0
      ? props.t.overview.estimatedTime.replace("{{minutes}}", String(minutes))
      : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

const BannerAction = (props: LessonBannerProps) => {
  if (props.isLocked) {
    return (
      <span className="text-ink-muted border-edge inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border-2 bg-white px-4 py-2.5 text-sm font-extrabold tracking-wide uppercase sm:w-auto">
        <Lock className="h-4 w-4" strokeWidth={2.75} />
        {props.t.overview.lockedLesson}
      </span>
    );
  }
  if (props.isCompleted) {
    return (
      <span
        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold tracking-wide uppercase sm:w-auto"
        style={{ color: COURSE_HIGHLIGHT.pathInk }}
      >
        <Check className="h-4 w-4" strokeWidth={3} />
        {props.t.overview.completedLesson}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={props.onStart}
      className="ease-press w-full shrink-0 cursor-pointer rounded-xl px-6 py-2.5 text-sm font-extrabold tracking-wide text-white uppercase transition-transform duration-100 active:translate-y-[4px] active:shadow-none sm:w-auto"
      style={{
        backgroundColor: COURSE_HIGHLIGHT.primary,
        boxShadow: `0 4px 0 0 ${COURSE_HIGHLIGHT.primaryLip}`,
      }}
    >
      {props.t.overview.start}
    </button>
  );
};

export function LessonBanner(props: LessonBannerProps) {
  const tone = bannerTone(props);
  const description = props.lesson.description?.trim();
  return (
    <motion.section
      initial={props.revealed ? { opacity: 0, y: 14, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      onAnimationComplete={props.revealed ? props.onRevealComplete : undefined}
      className="flex w-full flex-col items-start gap-4 rounded-[22px] px-5 py-4 sm:flex-row sm:items-center"
      style={{
        backgroundColor: tone.face,
        boxShadow: `0 ${BANNER_LIP_PX}px 0 0 ${tone.lip}, inset 0 3px 0 0 rgba(255,255,255,0.28)`,
        color: props.isLocked ? "var(--color-ink)" : "#ffffff",
      }}
    >
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: props.isLocked
            ? "#ffffff"
            : "rgba(255,255,255,0.22)",
          color: props.isLocked ? COURSE_HIGHLIGHT.lockedIcon : "#ffffff",
        }}
        aria-hidden
      >
        <LessonIconGlyph
          icon={props.lesson.icon}
          className="size-6"
          strokeWidth={2.4}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold tracking-[0.12em] uppercase opacity-90">
          {bannerMeta(props)}
        </p>
        <h2 className="mt-0.5 text-lg leading-tight font-extrabold">
          {props.lesson.title}
        </h2>
        {description ? (
          <p className="mt-1 line-clamp-2 text-[13px] leading-snug opacity-90">
            {description}
          </p>
        ) : null}
      </div>

      <BannerAction {...props} />
    </motion.section>
  );
}
