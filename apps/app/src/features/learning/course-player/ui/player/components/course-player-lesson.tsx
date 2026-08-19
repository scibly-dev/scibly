"use client";

import { useEffect } from "react";

import { useQuestionBlockStore } from "@/shared/content/editor/assessment/grading/question-block-store";

import { LessonPlayer } from "../lesson-player";
import { playerAnswerOrderIdentity } from "../utils/answer-order-identity";
import { useCoursePlayer } from "./course-player-context";

export function CoursePlayerLesson() {
  const {
    mode,
    viewState,
    currentLesson,
    enrollmentId,
    getInitialSceneIndex,
    handleLessonComplete,
    handleLessonSessionChange,
    handleExitLesson,
    onLeaveCourse,
    isAnonymous,
    anonymousId,
    hasCertificate,
    courseId,
    course,
    initialPendingSubmissions,
    initialLessonSP,
    restartCount,
    triesCount,
    progress,
  } = useCoursePlayer();

  const setLearnerIdentity = useQuestionBlockStore((s) => s.setLearnerIdentity);

  const { learnerId, attempt } = playerAnswerOrderIdentity({
    mode,
    enrollmentId,
    anonymousId,
    courseId,
    triesCount,
    restartCount,
  });

  const blocksHaveIdentity = useQuestionBlockStore(
    (s) =>
      s.learnerIdentity.learnerId === learnerId &&
      s.learnerIdentity.attempt === attempt,
  );

  useEffect(() => {
    setLearnerIdentity({ learnerId, attempt });
  }, [setLearnerIdentity, learnerId, attempt]);

  if (viewState.type !== "lesson" || !currentLesson || !blocksHaveIdentity)
    return null;

  const isLessonMode = course?.mode === "LESSON";
  const exitLesson =
    isLessonMode && onLeaveCourse ? onLeaveCourse : handleExitLesson;

  return (
    <LessonPlayer
      key={`lesson-${currentLesson.id}-r${restartCount}`}
      mode={mode}
      lesson={currentLesson}
      enrollmentId={enrollmentId}
      initialSceneIndex={
        viewState.sceneIndex ??
        (getInitialSceneIndex ? getInitialSceneIndex(currentLesson) : 0)
      }
      initialPendingSubmissions={initialPendingSubmissions}
      completedSceneIds={progress.completedSceneIds}
      initialSessionSP={initialLessonSP}
      onComplete={hasCertificate ? exitLesson : handleLessonComplete}
      onSessionChange={handleLessonSessionChange}
      onExit={exitLesson}
      canExit={!isLessonMode || Boolean(onLeaveCourse)}
      isReadOnly={hasCertificate}
      isAnonymous={isAnonymous}
      anonymousId={anonymousId}
      courseId={courseId}
      courseVersionId={course?.courseVersionId}
      triesCount={triesCount}
    />
  );
}
