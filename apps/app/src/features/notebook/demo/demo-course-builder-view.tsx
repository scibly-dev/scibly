"use client";

import type { NotebookTranslations } from "@/features/notebook/i18n/notebook.types";

import { routes } from "@scibly/routes";

import { useCourseBuilderRuntime } from "@/features/notebook/course-builder/components/course-builder-runtime-context";
import { CourseHeaderView } from "@/features/notebook/course-builder/components/course-header";
import { LessonNavigatorView } from "@/features/notebook/course-builder/components/lesson-navigator-view";
import { SceneEditorView } from "@/features/notebook/course-builder/components/scene-editor";
import {
  type SceneNavigatorItem,
  SceneNavigatorView,
} from "@/features/notebook/course-builder/components/scene-navigator-view";
import { CourseBuilderLayoutView } from "@/features/notebook/course-builder/course-builder-view";

import { useShowcaseSnapshot } from "./showcase-runtime";

export function DemoCourseBuilderView({ t }: { t: NotebookTranslations }) {
  const snapshot = useShowcaseSnapshot();
  const {
    state: { activeLesson, activeScene },
    actions: { setActiveLesson, setActiveScene, updateSceneTitle },
    meta: { editorCommandRef },
  } = useCourseBuilderRuntime();
  const linkedCourse = snapshot.linkedCourse;
  if (!linkedCourse) return null;

  const selectedLesson = linkedCourse.lessons.find(
    (lesson) => lesson.id === activeLesson?.id,
  );
  const scenes: readonly SceneNavigatorItem[] = selectedLesson?.scenes ?? [];

  return (
    <CourseBuilderLayoutView
      header={
        <CourseHeaderView
          t={t}
          courseTitle={linkedCourse.title}
          previewHref={routes.app.public.course(linkedCourse.id)}
        />
      }
      lessonNavigator={
        <LessonNavigatorView
          t={t}
          lessons={linkedCourse.lessons}
          activeLessonId={activeLesson?.id}
          isLoading={false}
          onSelectLesson={setActiveLesson}
          mode="readonly"
        />
      }
      sceneNavigator={
        <SceneNavigatorView
          t={t}
          activeLessonId={activeLesson?.id}
          activeSceneId={activeScene?.id}
          scenes={scenes}
          isScenesLoading={false}
          onSelectScene={setActiveScene}
          outdatedIndicators="hidden"
          mode="readonly"
        />
      }
      sceneEditor={
        <SceneEditorView
          t={t}
          scenes={scenes}
          activeScene={activeScene}
          onSelectScene={setActiveScene}
          onUpdateSceneTitle={updateSceneTitle}
          presentation={{ type: "showcase", commandRef: editorCommandRef }}
        />
      }
    />
  );
}
