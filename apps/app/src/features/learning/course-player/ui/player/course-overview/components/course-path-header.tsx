"use client";

import type { LearningPlayerTranslations } from "../../i18n/learning-player.types";

import { cn } from "@scibly/ui/utils";
import { BookOpen, RotateCcw, Zap } from "lucide-react";
import Image from "next/image";

import {
  courseTagClass,
  coverBadgeClass,
  coverToneFor,
} from "@/shared/ui/course-card-parts";

import { COURSE_HIGHLIGHT } from "../course-path-theme";

interface CoursePathHeaderProps {
  courseId: string;
  courseTitle: string;
  thumbnail?: string | null;
  completedLessons: number;
  totalLessons: number;
  earnedSp: number;
  maxSp: number;
  triesCount?: number;
  maxTries?: number | null;
  t: LearningPlayerTranslations;
}

const DIAL_SIZE_PX = 84;
const DIAL_STROKE_PX = 10;

const ProgressDial = ({ percent }: { percent: number }) => {
  const radius = (DIAL_SIZE_PX - DIAL_STROKE_PX) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = DIAL_SIZE_PX / 2;
  return (
    <div
      className="relative shrink-0"
      style={{ width: DIAL_SIZE_PX, height: DIAL_SIZE_PX }}
    >
      <svg
        width={DIAL_SIZE_PX}
        height={DIAL_SIZE_PX}
        viewBox={`0 0 ${DIAL_SIZE_PX} ${DIAL_SIZE_PX}`}
        aria-hidden
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="#ffffff"
          stroke="var(--color-edge)"
          strokeWidth={DIAL_STROKE_PX}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={COURSE_HIGHLIGHT.primary}
          strokeWidth={DIAL_STROKE_PX}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          transform={`rotate(-90 ${center} ${center})`}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg leading-none font-extrabold">
        {percent}%
      </span>
    </div>
  );
};

const CourseCover = ({
  courseId,
  thumbnail,
  alt,
}: {
  courseId: string;
  thumbnail?: string | null;
  alt: string;
}) =>
  thumbnail ? (
    <div className="border-edge relative size-16 shrink-0 overflow-hidden rounded-[18px] border-2">
      <Image
        src={thumbnail}
        alt={alt}
        fill
        className="object-cover"
        sizes="64px"
      />
    </div>
  ) : (
    <span
      className={cn(
        "flex size-16 shrink-0 rotate-6 items-center justify-center rounded-[18px] border border-black/[0.06]",
        coverToneFor(courseId).tile,
      )}
      aria-hidden
    >
      <BookOpen className="size-8" strokeWidth={2.2} />
    </span>
  );

export function CoursePathHeader({
  courseId,
  courseTitle,
  thumbnail,
  completedLessons,
  totalLessons,
  earnedSp,
  maxSp,
  triesCount = 0,
  maxTries,
  t,
}: CoursePathHeaderProps) {
  const percent =
    totalLessons > 0
      ? Math.min(100, Math.round((completedLessons / totalLessons) * 100))
      : 0;

  return (
    <header className="text-ink flex w-full items-center gap-4 px-1">
      <CourseCover
        courseId={courseId}
        thumbnail={thumbnail}
        alt={t.overview.courseCover}
      />

      <div className="min-w-0 flex-1">
        <p className="text-ink-soft text-[11px] font-bold tracking-[0.14em] uppercase">
          {t.overview.pathEyebrow}
        </p>
        <h1 className="mt-1 text-2xl leading-tight font-bold tracking-tight text-balance">
          {courseTitle}
        </h1>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span className={cn(courseTagClass, "inline-flex py-1")}>
            {t.overview.progressLessonsCount
              .replace("{{completed}}", String(completedLessons))
              .replace("{{total}}", String(totalLessons))}
          </span>

          <span className={cn(coverBadgeClass, "flex items-center gap-1.5")}>
            <Zap className="h-3.5 w-3.5 text-amber-500" fill="currentColor" />
            <span>
              {earnedSp.toLocaleString()}
              <span className="text-ink-soft">/{maxSp.toLocaleString()}</span>
            </span>
          </span>

          {maxTries != null ? (
            <span
              className={cn(
                courseTagClass,
                "inline-flex items-center gap-1.5 py-1",
              )}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t.overview.attemptsUsedStatus
                .replace("{{tries}}", String(triesCount))
                .replace("{{max}}", String(maxTries))}
            </span>
          ) : null}
        </div>
      </div>

      <ProgressDial percent={percent} />
    </header>
  );
}
