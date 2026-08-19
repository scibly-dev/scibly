"use client";

import { LessonComplete } from "../lesson-complete";
import { useCoursePlayer } from "./course-player-context";

export function CoursePlayerComplete() {
  const {
    viewState,
    currentLesson,
    lessonMaxSp,
    nextLessonTitle,
    handleContinueFromComplete,
  } = useCoursePlayer();

  if (viewState.type !== "complete" || !currentLesson) return null;

  return (
    <LessonComplete
      key={`complete-${currentLesson.id}`}
      lessonTitle={currentLesson.title}
      spEarned={viewState.spEarned}
      lessonMaxSp={lessonMaxSp}
      nextLessonTitle={nextLessonTitle}
      onContinue={handleContinueFromComplete}
    />
  );
}
