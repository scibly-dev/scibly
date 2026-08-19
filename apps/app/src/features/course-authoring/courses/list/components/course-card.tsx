"use client";

import { routes } from "@scibly/routes";
import { cardClass, cardInteractiveClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import Link from "next/link";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { type RouterOutputs } from "@/shared/api/trpc/contracts";
import {
  courseCardActionClass,
  courseTagClass,
  CourseThumbnail,
  coverBadgeClass,
} from "@/shared/ui/course-card-parts";

import { CoursePublishStatusBadge } from "./course-publish-status-badge";

type CourseListItem = RouterOutputs["course"]["list"]["items"][number];

interface CourseCardProps {
  course: CourseListItem;
  orgSlug: string;
}

export function CourseCardCover({ course }: { course: CourseListItem }) {
  return (
    <CourseThumbnail src={course.thumbnail} alt={course.title} seed={course.id}>
      <div className="absolute top-4 right-4 z-10">
        <span className={coverBadgeClass}>
          {course.category || "Uncategorized"}
        </span>
      </div>
    </CourseThumbnail>
  );
}

export function CourseCard({ course, orgSlug }: CourseCardProps) {
  const { translations: t } = useTranslation("courses");

  return (
    <Link
      href={routes.app.profile.org(orgSlug).courses.detail(course.id)}
      className={cn(
        cardClass,
        cardInteractiveClass,
        "group relative flex flex-col overflow-hidden",
      )}
    >
      <CourseCardCover course={course} />

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-6">
        <div className="flex-1">
          <h3 className="text-ink group-hover:text-link mb-1.5 line-clamp-1 text-[18px] font-semibold tracking-tight transition-colors">
            {course.title}
          </h3>
          <div className="mb-2 flex items-center gap-2">
            <CoursePublishStatusBadge
              latestPublishedVersion={course.latestPublishedVersion}
              draftVersion={(course.latestPublishedVersion?.version ?? 0) + 1}
              t={t}
              variant="card"
            />
            {course.mode === "LESSON" && (
              <span className={courseTagClass}>{t.mode.badge}</span>
            )}
          </div>
          <p className="text-ink-muted mb-4 line-clamp-2 text-[14px] leading-relaxed">
            {course.description || "No description provided."}
          </p>
          {course.tags && course.tags.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {course.tags.slice(0, 3).map((tag) => (
                <span key={tag} className={courseTagClass}>
                  {tag}
                </span>
              ))}
              {course.tags.length > 3 && (
                <span className={courseTagClass}>
                  +{course.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Area */}
        <div className="border-hairline mt-auto flex items-center justify-between border-t-2 pt-5">
          <div className="flex items-center gap-4">
            <span className="text-ink-soft flex items-center gap-1.5 text-[13px] font-semibold">
              <BookOpen className="h-3.5 w-3.5" />
              {course._count.lessons} Missions
            </span>
            <span className="text-ink-soft flex items-center gap-1.5 text-[13px] font-semibold">
              <Clock className="h-3.5 w-3.5" />
              {course.totalEstimatedTimeMinutes > 0
                ? `${course.totalEstimatedTimeMinutes}m`
                : "No estimated time"}
            </span>
          </div>
          <div className={courseCardActionClass}>
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
