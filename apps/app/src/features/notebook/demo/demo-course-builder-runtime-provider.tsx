"use client";

import type { MountedEditorCommands } from "@/features/course-authoring/client";

import { useCallback, useMemo, useRef } from "react";

import { CourseBuilderRuntimeProvider } from "@/features/notebook/course-builder/components/course-builder-runtime-context";

import { useShowcaseRuntime, useShowcaseSnapshot } from "./showcase-runtime";

export function DemoCourseBuilderRuntimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { store } = useShowcaseRuntime();
  const snapshot = useShowcaseSnapshot();
  const editorCommandRef = useRef<MountedEditorCommands>(null);
  const linkedCourse = snapshot.linkedCourse;
  const activeLesson = linkedCourse?.lessons.find(
    (lesson) => lesson.id === snapshot.activeLessonId,
  );
  const activeScene = activeLesson?.scenes.find(
    (scene) => scene.id === snapshot.activeSceneId,
  );

  const reset = useCallback(() => store.reset(), [store]);
  const setActiveLesson = useCallback(
    (lesson: { id: string } | undefined) => {
      if (lesson) store.setActiveLesson(lesson.id);
    },
    [store],
  );
  const setActiveScene = useCallback(
    (scene: { id: string } | undefined) => {
      if (scene) store.setActiveScene(scene.id);
    },
    [store],
  );
  const updateSceneTitle = useCallback(
    (sceneId: string, title: string) => store.updateSceneTitle(sceneId, title),
    [store],
  );
  const value = useMemo(
    () => ({
      state: {
        course: linkedCourse
          ? { id: linkedCourse.id, title: linkedCourse.title }
          : undefined,
        activeLesson: activeLesson
          ? { id: activeLesson.id, title: activeLesson.title }
          : undefined,
        activeScene: activeScene
          ? { id: activeScene.id, title: activeScene.title }
          : undefined,
      },
      actions: {
        reset,
        setActiveLesson,
        setActiveScene,
        updateSceneTitle,
      },
      meta: { editorCommandRef },
    }),
    [
      activeLesson,
      activeScene,
      linkedCourse,
      reset,
      setActiveLesson,
      setActiveScene,
      updateSceneTitle,
    ],
  );

  return (
    <CourseBuilderRuntimeProvider value={value}>
      {children}
    </CourseBuilderRuntimeProvider>
  );
}
