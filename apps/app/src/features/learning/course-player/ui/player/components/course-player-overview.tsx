"use client";

import { type ReactNode } from "react";

import { CourseOverview } from "../course-overview";
import { useCoursePlayer } from "./course-player-context";

export function CoursePlayerOverview({
  breadcrumb,
}: {
  breadcrumb?: ReactNode;
}) {
  const {
    viewState,
    course,
    progress,
    courseMaxSP,
    triesCount,
    pathProgression,
    clearPathProgression,
    handleSelectLesson,
  } = useCoursePlayer();

  if (viewState.type !== "overview") return null;

  return (
    <>
      {breadcrumb}
      <CourseOverview
        key="overview"
        course={course!}
        progress={progress}
        courseMaxSP={courseMaxSP}
        triesCount={triesCount}
        pathProgression={pathProgression}
        onPathProgressionComplete={clearPathProgression}
        onSelectLesson={handleSelectLesson}
      />
    </>
  );
}
