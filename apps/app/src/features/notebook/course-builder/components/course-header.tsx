"use client";

import type { NotebookTranslations } from "../../i18n/notebook.types";

import { routes } from "@scibly/routes";
import { cn } from "@scibly/ui/utils";
import { ArrowLeft, ExternalLink, PlayCircle } from "lucide-react";
import Link from "next/link";

import {
  notebookBorder,
  notebookIconButton,
  notebookPrimaryButton,
} from "../../workspace/components/notebook-shell";
import { useCourseBuilderStore } from "../course-builder-store";
import { OutdatedScenesBanner } from "./outdated-scenes-banner";

interface CourseHeaderProps {
  t: NotebookTranslations;
  orgSlug: string;
  onExit?: () => void;
}

export function CourseHeaderView({
  t,
  courseTitle,
  previewHref,
  coursePreviewHref,
  onExit,
  outdatedScenesBanner,
}: {
  t: NotebookTranslations;
  courseTitle?: string;
  previewHref?: string;
  coursePreviewHref?: string;
  onExit?: () => void;
  outdatedScenesBanner?: React.ReactNode;
}) {
  const cb = t.studio.courseBuilder;

  const preview = coursePreviewHref
    ? {
        href: coursePreviewHref,
        icon: <ExternalLink className="h-4 w-4" />,
        label: cb.openPreview,
      }
    : previewHref && {
        href: previewHref,
        icon: <PlayCircle className="h-4 w-4" />,
        label: cb.preview,
      };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b-2 px-6 pt-5 pb-4",
        notebookBorder,
      )}
    >
      <div className="flex items-center gap-1.5">
        {onExit ? (
          <button
            type="button"
            id="course-builder-exit"
            onClick={onExit}
            title={cb.exitBuilder}
            className={cn(
              "-ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
              notebookIconButton,
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <p className="text-ink-faint text-[10px] font-bold tracking-widest uppercase dark:text-neutral-500">
          {cb.title}
        </p>
      </div>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-ink min-w-0 flex-1 truncate text-lg font-bold dark:text-neutral-100">
          {courseTitle}
        </h1>

        {preview ? (
          <Link
            href={preview.href}
            target="_blank"
            rel="noopener noreferrer"
            id="course-builder-preview"
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-2 rounded-xl px-4 text-sm font-bold",
              notebookPrimaryButton,
            )}
          >
            {preview.icon}
            {preview.label}
          </Link>
        ) : null}
      </div>

      {outdatedScenesBanner}
    </div>
  );
}

export function CourseHeader({ t, orgSlug, onExit }: CourseHeaderProps) {
  const course = useCourseBuilderStore((state) => state.course);
  const reset = useCourseBuilderStore((state) => state.reset);

  return (
    <CourseHeaderView
      t={t}
      courseTitle={course?.title}
      coursePreviewHref={
        course
          ? routes.app.profile.org(orgSlug).courses.preview(course.id)
          : undefined
      }
      onExit={
        onExit
          ? () => {
              reset();
              onExit();
            }
          : undefined
      }
      outdatedScenesBanner={<OutdatedScenesBanner t={t.studio.courseBuilder} />}
    />
  );
}
