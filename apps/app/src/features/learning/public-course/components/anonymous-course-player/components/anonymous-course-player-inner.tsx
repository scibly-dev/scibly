"use client";

import { type AnonymousSessionSource } from "@scibly/db/enums";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { ConfirmDeleteDialog } from "@/shared/ui/confirm-delete-dialog";

import { CoursePlayer } from "../../../../course-player/ui/player";
import { CourseComplete } from "../../../../course-player/ui/player/components/course-complete";
import { usePlayerNavigation } from "../../../../course-player/ui/player/hooks/use-player-navigation";
import { LessonPlayerLoading } from "../../../../course-player/ui/player/lesson-player/components/lesson-player-loading";
import { EmbedScrollIntoView } from "../../../../embed-course/components/embed-scroll-into-view";
import { CourseUnavailableState } from "./course-unavailable-state";
import { EphemeralProgressNotice } from "./ephemeral-progress-notice";
import { PoweredByScibly } from "./powered-by-scibly";
import { useRestartConfirmation } from "./use-restart-confirmation";

interface AnonymousCoursePlayerInnerProps {
  courseId: string;
  anonymousId: string;

  progressPersists: boolean;
  source: AnonymousSessionSource;
  embedOrigin?: string | null;
}

export function AnonymousCoursePlayerInner({
  courseId,
  anonymousId,
  progressPersists,
  source,
  embedOrigin,
}: AnonymousCoursePlayerInnerProps) {
  const isEmbedded = source === "EMBED";
  const playerState = usePlayerNavigation({
    courseId,
    isAnonymous: true,
    anonymousId,
    source,

    embedOrigin: window.parent === window.top ? embedOrigin : null,
  });
  const { course, isLocked, isPubliclyUnavailable } = playerState;
  const { translations } = useTranslation("learningPlayer");
  const restartConfirmation = useRestartConfirmation(
    playerState.handleRestartAttempt,
  );

  if (isPubliclyUnavailable) {
    return <CourseUnavailableState />;
  }

  if (isLocked && course) {
    return (
      <div className="mx-auto flex min-h-[calc(50*var(--player-vh,1vh))] w-full max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <CoursePlayer.Locked
          courseTitle={course.title}
          maxTries={course.maxTries!}
        />
      </div>
    );
  }

  return (
    <CoursePlayer
      value={playerState}
      loadingFallback={
        course?.mode === "LESSON" ? <LessonPlayerLoading /> : undefined
      }
    >
      {isEmbedded && <EmbedScrollIntoView hostOrigin={embedOrigin ?? null} />}
      {!progressPersists && playerState.viewState.type === "overview" && (
        <EphemeralProgressNotice />
      )}
      <CoursePlayer.Overview
        breadcrumb={
          course && !isEmbedded ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              {course.organization?.name && (
                <>
                  <span>{course.organization.name}</span>
                  <span>/</span>
                </>
              )}
              <span className="text-foreground font-medium">
                {course.title}
              </span>
            </div>
          ) : null
        }
      />
      <CoursePlayer.Shell>
        <CoursePlayer.Lesson key={`lesson-${courseId}`} />
        <CoursePlayer.Complete key={`complete-${courseId}`} />
        <CoursePlayer.CourseComplete key={`course-complete-${courseId}`}>
          {course && (
            <>
              <CourseComplete
                courseTitle={course.title}
                achievedScorePct={playerState.achievedScorePct}
                requiredScorePct={playerState.requiredScorePct}
                totalSP={playerState.progress.totalSP}
                hasCertificate={false}
                triesCount={playerState.triesCount}
                maxTries={playerState.maxTries}
                onRestart={restartConfirmation.requestRestart}
                isRestartPending={playerState.isRestartPending}
                showBranding={!isEmbedded}
              />
              {isEmbedded && <PoweredByScibly />}
            </>
          )}
        </CoursePlayer.CourseComplete>
      </CoursePlayer.Shell>
      <ConfirmDeleteDialog
        open={restartConfirmation.isOpen}
        title={translations.restartConfirm.title}
        description={translations.restartConfirm.description}
        cancelLabel={translations.restartConfirm.cancel}
        confirmLabel={translations.restartConfirm.confirm}
        onCancel={restartConfirmation.cancel}
        onConfirm={restartConfirmation.confirm}
        isConfirming={playerState.isRestartPending}
      />
    </CoursePlayer>
  );
}
