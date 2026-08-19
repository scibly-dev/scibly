"use client";

import { Button } from "@scibly/ui/components/button";
import { cn } from "@scibly/ui/utils";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";

import { useCourseOutdatedScenes } from "@/shared/content/course/hooks/use-course-outdated-scenes";

interface CourseOutdatedBannerLabels {
  title: string;
  description: string;
  actionLabel: string;
}

interface CourseOutdatedBannerBaseProps {
  courseId: string | undefined;
  labels: CourseOutdatedBannerLabels;

  hidden?: boolean;
  className?: string;

  outdatedSceneCount?: number;
}

type CourseOutdatedBannerProps = CourseOutdatedBannerBaseProps &
  (
    | { action: "button"; onAction: () => void }
    | { action: "link"; href: string }
  );

function replaceCount(template: string, count: number) {
  return template.replace("{{count}}", String(count));
}

export const BannerAction = ({
  labels,
  actionProps,
}: {
  labels: CourseOutdatedBannerLabels;
  actionProps:
    | { action: "button"; onAction: () => void }
    | { action: "link"; href: string };
}) => {
  if (actionProps.action === "button") {
    return (
      <Button
        type="button"
        size="sm"
        onClick={actionProps.onAction}
        className="h-8 gap-1.5 rounded-full bg-amber-600 px-3.5 text-xs font-medium text-white shadow-sm hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
      >
        <RefreshCw className="h-3.5 w-3.5" /> {labels.actionLabel}
      </Button>
    );
  }
  return (
    <Link
      href={actionProps.href}
      className="shrink-0 self-start sm:self-center"
    >
      <Button
        type="button"
        size="sm"
        className="h-8 shrink-0 gap-1.5 rounded-full bg-amber-600 px-3.5 text-xs font-medium text-white shadow-sm hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
      >
        <RefreshCw className="h-3.5 w-3.5" /> {labels.actionLabel}
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </Link>
  );
};

export function CourseOutdatedBanner({
  courseId,
  labels,
  hidden = false,
  className,
  outdatedSceneCount: outdatedSceneCountProp,
  ...actionProps
}: CourseOutdatedBannerProps) {
  const { data: outdatedData } = useCourseOutdatedScenes(
    outdatedSceneCountProp === undefined ? courseId : undefined,
  );
  const outdatedSceneCount =
    outdatedSceneCountProp ?? outdatedData?.outdatedSceneCount ?? 0;

  if (hidden || outdatedSceneCount === 0) return null;

  return (
    <div
      role="status"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-amber-50/90 to-orange-50/60 px-4 py-3.5 shadow-sm dark:border-amber-900/50 dark:from-amber-950/50 dark:via-amber-950/35 dark:to-orange-950/25",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-6 -right-6 h-24 w-24 rounded-full bg-amber-200/30 blur-2xl dark:bg-amber-700/15"
      />

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 ring-1 ring-amber-200/80 dark:bg-amber-900/40 dark:ring-amber-800/60">
            <AlertTriangle className="h-4 w-4 text-amber-700 dark:text-amber-300" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-50">
              {replaceCount(labels.title, outdatedSceneCount)}
            </p>
            <p className="text-xs leading-relaxed text-amber-800/85 dark:text-amber-200/75">
              {labels.description}
            </p>
          </div>
        </div>

        <div className="shrink-0 self-start sm:self-center">
          <BannerAction labels={labels} actionProps={actionProps} />
        </div>
      </div>
    </div>
  );
}
