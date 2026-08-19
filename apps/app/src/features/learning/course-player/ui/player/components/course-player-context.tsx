"use client";

import { createContext, use } from "react";

import { type CoursePlayerContextValue } from "../utils/player-types";

export const CoursePlayerContext =
  createContext<CoursePlayerContextValue | null>(null);

export function useCoursePlayer() {
  const ctx = use(CoursePlayerContext);
  if (!ctx) {
    throw new Error(
      "CoursePlayer components must be wrapped in <CoursePlayer>",
    );
  }
  return ctx;
}
