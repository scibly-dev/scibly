"use client";

import { routes } from "@scibly/routes";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { CoursePlayer } from "../../ui/player";
import { CourseComplete } from "../../ui/player/components/course-complete";
import { CourseLockedState } from "../../ui/player/components/course-locked-state";
import { usePlayerNavigation } from "../../ui/player/hooks/use-player-navigation";
import { CourseBreadcrumb } from "./components/course-breadcrumb";
import { CourseReadOnlyInfo } from "./components/course-read-only-info";

interface LearnPageClientProps {
  orgSlug: string;
  courseId: string;
}

export function LearnPageClient({ orgSlug, courseId }: LearnPageClientProps) {
  const playerState = usePlayerNavigation({ courseId });
  const { isLocked, course, hasCertificate, status } = playerState;
  const router = useRouter();
  const leaveCourse = useCallback(
    () => router.push(routes.app.profile.org(orgSlug).dashboard),
    [router, orgSlug],
  );

  const isLessonMode = course?.mode === "LESSON";

  if (isLocked && course) {
    return (
      <div className="flex w-full flex-col gap-8 pb-20">
        <CourseBreadcrumb orgSlug={orgSlug} courseTitle={course.title} />
        <CourseLockedState
          courseTitle={course.title}
          maxTries={course.maxTries!}
        />
      </div>
    );
  }

  if (hasCertificate && status !== "COMPLETED" && course) {
    return (
      <div className="flex w-full flex-col gap-8 pb-20">
        <CourseBreadcrumb orgSlug={orgSlug} courseTitle={course.title} />
        <CourseReadOnlyInfo
          courseTitle={course.title}
          version={playerState.version}
        />
      </div>
    );
  }

  return (
    <CoursePlayer value={{ ...playerState, onLeaveCourse: leaveCourse }}>
      <CoursePlayer.Overview
        breadcrumb={
          course ? (
            <CourseBreadcrumb orgSlug={orgSlug} courseTitle={course.title} />
          ) : null
        }
      />
      <CoursePlayer.Shell>
        <CoursePlayer.Lesson key={`lesson-${courseId}`} />
        <CoursePlayer.Complete key={`complete-${courseId}`} />
        <CoursePlayer.CourseComplete key={`course-complete-${courseId}`}>
          {course && (
            <CourseComplete
              orgSlug={orgSlug}
              courseTitle={course.title}
              totalSP={playerState.progress.totalSP}
              hasCertificate={playerState.hasCertificate}
              achievedScorePct={playerState.achievedScorePct}
              requiredScorePct={playerState.requiredScorePct}
              triesCount={playerState.triesCount}
              maxTries={playerState.maxTries}
              onBackToDashboard={
                isLessonMode ? leaveCourse : playerState.handleBackToOverview
              }
              onRestart={
                isLessonMode ? leaveCourse : playerState.handleBackToOverview
              }
              isRestartPending={playerState.isRestartPending}
            />
          )}
        </CoursePlayer.CourseComplete>
      </CoursePlayer.Shell>
    </CoursePlayer>
  );
}
