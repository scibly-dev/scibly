"use client";

import { type ReactNode } from "react";

import { useCoursePlayer } from "./course-player-context";

export function CoursePlayerCourseComplete({
  children,
}: {
  children: ReactNode;
}) {
  const { viewState } = useCoursePlayer();

  if (viewState.type !== "course_complete") return null;

  return <>{children}</>;
}
