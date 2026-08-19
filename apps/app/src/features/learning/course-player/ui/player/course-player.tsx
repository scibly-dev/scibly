"use client";

import { CourseLockedState } from "./components/course-locked-state";
import { CoursePlayerComplete } from "./components/course-player-complete";
import { CoursePlayerCourseComplete } from "./components/course-player-course-complete";
import { CoursePlayerLesson } from "./components/course-player-lesson";
import { CoursePlayerOverview } from "./components/course-player-overview";
import { CoursePlayerRoot } from "./components/course-player-root";
import { CoursePlayerShell } from "./components/course-player-shell";

export const CoursePlayer = Object.assign(CoursePlayerRoot, {
  Overview: CoursePlayerOverview,
  Lesson: CoursePlayerLesson,
  Complete: CoursePlayerComplete,
  CourseComplete: CoursePlayerCourseComplete,
  Shell: CoursePlayerShell,
  Locked: CourseLockedState,
});
