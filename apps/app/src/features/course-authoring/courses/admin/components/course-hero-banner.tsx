import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { BookOpen, Clock } from "lucide-react";
import Image from "next/image";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { courseTagClass, coverToneFor } from "@/shared/ui/course-card-parts";

import { CoursePublishStatusBadge } from "../../list/components/course-publish-status-badge";

interface CourseHeroBannerProps {
  course: {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    category: string | null;
    tags: string[];
  };
  totalLessons: number;
  totalTimeMinutes: number;
  draftVersion?: number;
  latestPublishedVersion?: { version: number } | null;
  className?: string;
  children?: React.ReactNode;
  t?: CoursesTranslations;
}

export function CourseHeroBackground({
  course,
  coverLabel,
}: Pick<CourseHeroBannerProps, "course"> & { coverLabel: string }) {
  if (!course.thumbnail) {
    return (
      <span
        aria-hidden
        className={cn(
          "absolute top-1/2 right-16 z-0 hidden size-32 -translate-y-1/2 rotate-6 items-center justify-center rounded-[32px] border border-black/[0.06] lg:flex",
          coverToneFor(course.id).tile,
        )}
      >
        <BookOpen className="size-16" strokeWidth={2} />
      </span>
    );
  }
  return (
    <>
      <div className="absolute inset-0 z-10 hidden sm:block">
        <Image
          src={course.thumbnail}
          alt={coverLabel}
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-slate-900 via-slate-950 to-neutral-950 sm:hidden" />
    </>
  );
}

export function CourseHeroMetadata({
  hasImage,
  lessonLabel,
  timeLabel,
}: {
  hasImage: boolean;
  lessonLabel: string;
  timeLabel: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-semibold",
        hasImage ? "text-white/70" : "text-ink-soft",
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {lessonLabel}
      </span>
      <span
        className={hasImage ? "text-white/30" : "text-ink-faint"}
        aria-hidden
      >
        ·
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {timeLabel}
      </span>
    </div>
  );
}

export function CourseHeroTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="mt-auto flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className={cn(courseTagClass, "px-3 py-1.5 text-[13px]")}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function CourseHeroContent(
  props: CourseHeroBannerProps & {
    hasImage: boolean;
    lessonLabel: string;
    timeLabel: string;
    coverLabel: string;
  },
) {
  return (
    <div className="flex max-w-3xl flex-col">
      {props.hasImage && (
        <div className="border-edge relative z-20 mb-6 aspect-video w-full max-w-[280px] shrink-0 overflow-hidden rounded-2xl border-2 shadow-[0_3px_0_0_var(--color-lip)] sm:hidden">
          <Image
            src={props.course.thumbnail!}
            alt={props.coverLabel}
            fill
            className="object-cover"
          />
        </div>
      )}
      {props.t && props.latestPublishedVersion !== undefined && (
        <CoursePublishStatusBadge
          latestPublishedVersion={props.latestPublishedVersion}
          draftVersion={props.draftVersion}
          t={props.t}
          variant="hero"
          hasImage={props.hasImage}
        />
      )}
      {props.course.category && (
        <p
          className={cn(
            "mb-3 text-[14px] font-semibold tracking-widest uppercase",
            props.hasImage ? "text-white/80" : "text-ink-soft",
          )}
        >
          {props.course.category}
        </p>
      )}
      <h1
        className={cn(
          "mb-4 text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl",
          props.hasImage ? "text-white drop-shadow-md" : "text-ink",
        )}
      >
        {props.course.title}
      </h1>
      {props.course.description && (
        <p
          className={cn(
            "mb-5 max-w-2xl text-[16px] leading-relaxed",
            props.hasImage ? "text-white/80 drop-shadow-sm" : "text-ink-muted",
          )}
        >
          {props.course.description}
        </p>
      )}
      <CourseHeroMetadata
        hasImage={props.hasImage}
        lessonLabel={props.lessonLabel}
        timeLabel={props.timeLabel}
      />
      <CourseHeroTags tags={props.course.tags} />
    </div>
  );
}

function buildHeroLabels(
  totalLessons: number,
  totalTimeMinutes: number,
  t?: CoursesTranslations,
) {
  const lessonTemplate =
    totalLessons === 1
      ? (t?.detail.badgeLesson ?? "{{count}} Lesson")
      : (t?.detail.badgeLessons ?? "{{count}} Lessons");
  return {
    courseCover: t?.detail.courseCover ?? "Course Cover",
    lessonLabel: lessonTemplate.replace("{{count}}", String(totalLessons)),
    timeLabel:
      totalTimeMinutes > 0
        ? `${totalTimeMinutes}m`
        : (t?.detail.noEstimatedTime ?? "No estimated time"),
  };
}

export function CourseHeroBanner({
  course,
  totalLessons,
  totalTimeMinutes,
  draftVersion,
  latestPublishedVersion,
  className,
  children,
  t,
}: CourseHeroBannerProps) {
  const hasImage = !!course.thumbnail;

  const { courseCover, lessonLabel, timeLabel } = buildHeroLabels(
    totalLessons,
    totalTimeMinutes,
    t,
  );

  return (
    <div
      className={cn(
        cardClass,
        "relative w-full overflow-hidden pt-16 pb-12 lg:pt-20 lg:pb-16",
        hasImage ? "bg-slate-900" : coverToneFor(course.id).panel,
        className,
      )}
    >
      <CourseHeroBackground course={course} coverLabel={courseCover} />
      <div className="relative z-20 mx-auto flex w-full max-w-[1400px] flex-col justify-between gap-8 px-8 lg:flex-row lg:items-end lg:gap-12 lg:px-12">
        <CourseHeroContent
          course={course}
          totalLessons={totalLessons}
          totalTimeMinutes={totalTimeMinutes}
          draftVersion={draftVersion}
          latestPublishedVersion={latestPublishedVersion}
          t={t}
          hasImage={hasImage}
          lessonLabel={lessonLabel}
          timeLabel={timeLabel}
          coverLabel={courseCover}
        />
        {children && (
          <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row lg:w-auto">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
