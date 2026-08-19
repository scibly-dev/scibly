"use client";

import { routes } from "@scibly/routes";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import {
  CourseComplete,
  CoursePlayer,
} from "@/features/learning/course-player/client";
import { useTranslation } from "@/i18n/hooks/use-translation";

import { PreviewBreadcrumb } from "./components/preview-breadcrumb";
import { usePreviewNavigation } from "./hooks/use-preview-navigation";

interface PreviewPageClientProps {
  orgSlug: string;
  courseId: string;
}

export function PreviewPageClient({
  orgSlug,
  courseId,
}: PreviewPageClientProps) {
  const playerState = usePreviewNavigation({ courseId });
  const { course } = playerState;
  const { translations: t } = useTranslation("courses");
  const router = useRouter();
  const leavePreview = useCallback(
    () => router.push(routes.app.profile.org(orgSlug).courses.detail(courseId)),
    [router, orgSlug, courseId],
  );

  const isLessonMode = course?.mode === "LESSON";

  return (
    <CoursePlayer value={{ ...playerState, onLeaveCourse: leavePreview }}>
      <CoursePlayer.Overview
        breadcrumb={
          course ? (
            <PreviewBreadcrumb
              orgSlug={orgSlug}
              courseId={courseId}
              courseTitle={course.title}
            />
          ) : null
        }
      />
      <CoursePlayer.Shell>
        <CoursePlayer.Lesson key={`lesson-${courseId}`} />
        <CoursePlayer.Complete key={`complete-${courseId}`} />
        <CoursePlayer.CourseComplete key={`course-complete-${courseId}`}>
          {course && (
            <CourseComplete
              courseTitle={course.title}
              totalSP={playerState.progress.totalSP}
              hasCertificate={false}
              achievedScorePct={playerState.achievedScorePct}
              requiredScorePct={playerState.requiredScorePct}
              triesCount={0}
              maxTries={null}
              onBackToDashboard={
                isLessonMode ? leavePreview : playerState.handleBackToOverview
              }
              backLabel={t.detail.previewBackToCourse}
            />
          )}
        </CoursePlayer.CourseComplete>
      </CoursePlayer.Shell>
    </CoursePlayer>
  );
}
