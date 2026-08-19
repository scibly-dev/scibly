"use client";

import type { EnrolledCoursesTranslations } from "../i18n/enrolled-courses.types";

import { routes } from "@scibly/routes";
import { cardClass, cardInteractiveClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { BookOpen, Clock, Play, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { api } from "@/shared/api/trpc/client";
import { type RouterOutputs } from "@/shared/api/trpc/contracts";
import {
  courseCardActionClass,
  CourseThumbnail,
  coverBadgeClass,
} from "@/shared/ui/course-card-parts";
import { usePagination } from "@/shared/ui/hooks/use-pagination";

import { CoursePagination } from "./course-pagination";
import { CourseSkeletonGrid } from "./course-skeleton-grid";

type EnrolledCourseItem =
  RouterOutputs["learning"]["listEnrolledCourses"]["items"][number];

export const ITEMS_PER_PAGE = 6;

interface EnrolledCourseCardProps {
  enrollment: EnrolledCourseItem;
  orgSlug: string;
  t: EnrolledCoursesTranslations["courses"];
}

function courseState(enrollment: EnrolledCourseItem) {
  const completed =
    enrollment.status === "COMPLETED" && enrollment.hasCertificate;
  const failed =
    enrollment.status === "COMPLETED" && !enrollment.hasCertificate;
  return {
    completed,
    failed,
    inProgress: enrollment.status === "IN_PROGRESS",
  };
}

export const CourseBanner = ({
  enrollment,
  t,
}: Omit<EnrolledCourseCardProps, "orgSlug">) => {
  const { course } = enrollment;
  const state = courseState(enrollment);
  const statusClass = state.completed
    ? "border-green-400 bg-green-200 text-green-800 shadow-[0_2px_0_0_var(--color-green-400)]"
    : state.failed
      ? "border-amber-400 bg-amber-200 text-amber-800 shadow-[0_2px_0_0_var(--color-amber-400)]"
      : state.inProgress
        ? "border-blue-400 bg-blue-200 text-blue-800 shadow-[0_2px_0_0_var(--color-blue-400)]"
        : "";
  const statusLabel = state.completed
    ? t.status.completed
    : state.failed
      ? t.status.notPassed
      : state.inProgress
        ? t.status.inProgress
        : t.status.notStarted;
  return (
    <CourseThumbnail src={course.thumbnail} alt={course.title} seed={course.id}>
      <div className="absolute top-4 right-4 z-10">
        <span className={cn(coverBadgeClass, statusClass)}>{statusLabel}</span>
      </div>
      {course.maxTries !== null ? (
        <div className="absolute bottom-4 left-4 z-10">
          <span
            className={cn(
              coverBadgeClass,
              "flex items-center gap-1 text-[11px]",
              enrollment.triesCount >= course.maxTries &&
                "border-red-400 bg-red-200 text-red-800 shadow-[0_2px_0_0_var(--color-red-400)]",
            )}
          >
            <RotateCcw className="h-3 w-3" />
            {enrollment.triesCount} / {course.maxTries} {t.attempts}
          </span>
        </div>
      ) : null}
    </CourseThumbnail>
  );
};

export const CourseCardFooter = ({
  enrollment,
  t,
}: Omit<EnrolledCourseCardProps, "orgSlug">) => {
  const { course } = enrollment;
  const state = courseState(enrollment);
  const icon = state.completed ? (
    <Trophy className="h-4 w-4" />
  ) : state.failed ? (
    <RotateCcw className="h-4 w-4" />
  ) : (
    <Play className="h-4 w-4" />
  );
  return (
    <div className="border-hairline mt-auto flex items-center justify-between border-t-2 pt-5">
      <div className="flex items-center gap-4">
        <span className="text-ink-soft flex items-center gap-1.5 text-[13px] font-semibold">
          <BookOpen className="h-3.5 w-3.5" />
          {course._count.lessons} {t.lessons}
        </span>
        <span className="text-ink-soft flex items-center gap-1.5 text-[13px] font-semibold">
          <Clock className="h-3.5 w-3.5" />
          {course.totalEstimatedTimeMinutes > 0
            ? `${course.totalEstimatedTimeMinutes}m`
            : t.noEstimatedTime}
        </span>
      </div>
      <div
        className={cn(
          courseCardActionClass,
          state.completed && "border-green-400 text-green-700",
          state.failed && "border-amber-400 text-amber-700",
        )}
      >
        {icon}
      </div>
    </div>
  );
};

export function EnrolledCourseCard({
  enrollment,
  orgSlug,
  t,
}: EnrolledCourseCardProps) {
  const { course } = enrollment;
  return (
    <Link
      href={routes.app.profile.org(orgSlug).learn.course(course.id)}
      className={cn(
        cardClass,
        cardInteractiveClass,
        "group relative flex flex-col overflow-hidden",
      )}
    >
      <CourseBanner enrollment={enrollment} t={t} />

      <div className="flex flex-1 flex-col p-6">
        <div className="flex-1">
          <h3 className="text-ink group-hover:text-link mb-2 line-clamp-1 text-[18px] font-semibold tracking-tight transition-colors">
            {course.title}
          </h3>
          <p className="text-ink-muted mb-4 line-clamp-2 text-[14px] leading-relaxed">
            {course.description || t.noDescription}
          </p>
        </div>

        <CourseCardFooter enrollment={enrollment} t={t} />
      </div>
    </Link>
  );
}

export function EnrolledCourseList({ orgSlug }: { orgSlug: string }) {
  const { cursor, pageSize, getPaginationProps } = usePagination({
    pageSize: ITEMS_PER_PAGE,
  });
  const { translations } = useTranslation("learn");
  const t = translations.courses;

  const { data, isLoading } = api.learning.listEnrolledCourses.useQuery({
    orgSlug,
    limit: pageSize,
    cursor,
  });

  const enrollments = data?.items ?? [];
  const paginationProps = getPaginationProps(
    data?.totalCount,
    !!data?.nextCursor,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex min-h-[560px] flex-col">
        {isLoading ? (
          <CourseSkeletonGrid />
        ) : enrollments.length > 0 ? (
          <div className="grid grid-cols-1 content-start gap-6 md:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => (
              <EnrolledCourseCard
                key={enrollment.enrollmentId}
                enrollment={enrollment}
                orgSlug={orgSlug}
                t={t}
              />
            ))}
          </div>
        ) : (
          <div className="border-hairline flex flex-1 flex-col items-center justify-center rounded-[20px] border-2 border-dashed bg-white/60 py-20 text-center">
            <BookOpen className="mb-4 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
            <h3 className="text-foreground text-lg font-medium">
              {t.noCourses}
            </h3>
            <p className="text-muted-foreground mt-1">{t.notEnrolled}</p>
          </div>
        )}
      </div>

      <CoursePagination
        currentPage={paginationProps.page}
        setCurrentPage={paginationProps.setPage}
        totalPages={paginationProps.totalPages}
        totalCount={paginationProps.totalCount}
        itemsPerPage={paginationProps.pageSize}
      />
    </div>
  );
}
