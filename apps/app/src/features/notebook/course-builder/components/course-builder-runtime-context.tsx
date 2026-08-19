"use client";

import type { RefObject } from "react";
import type { MountedEditorCommands } from "@/features/course-authoring/client";
import type { CourseEntity } from "../course-builder-store";

import { createContext, use } from "react";

type CourseBuilderRuntimeState = {
  course: CourseEntity | undefined;
  activeLesson: CourseEntity | undefined;
  activeScene: CourseEntity | undefined;
};

type CourseBuilderRuntimeActions = {
  reset: () => void;
  setActiveLesson: (lesson: CourseEntity | undefined) => void;
  setActiveScene: (scene: CourseEntity | undefined) => void;
  updateSceneTitle: (sceneId: string, title: string) => void;
};

type CourseBuilderRuntimeMeta = {
  editorCommandRef: RefObject<MountedEditorCommands | null>;
};

type CourseBuilderRuntimeValue = {
  state: CourseBuilderRuntimeState;
  actions: CourseBuilderRuntimeActions;
  meta: CourseBuilderRuntimeMeta;
};

const CourseBuilderRuntimeContext =
  createContext<CourseBuilderRuntimeValue | null>(null);

export function CourseBuilderRuntimeProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: CourseBuilderRuntimeValue;
}) {
  return (
    <CourseBuilderRuntimeContext value={value}>
      {children}
    </CourseBuilderRuntimeContext>
  );
}

export function useCourseBuilderRuntime(): CourseBuilderRuntimeValue {
  const value = use(CourseBuilderRuntimeContext);
  if (!value) {
    throw new Error(
      "useCourseBuilderRuntime must be used within CourseBuilderRuntimeProvider",
    );
  }
  return value;
}
