"use client";

import type { ReactNode } from "react";
import type { NotebookTranslations } from "../i18n/notebook.types";

import { useCourseSync } from "@/shared/content/course/hooks/use-course-sync";
import { SessionAwareRoom } from "@/shared/content/editor/collaboration/session-aware-room";

import { AgentFollowBanner } from "./components/agent-follow-banner";
import { CourseHeader } from "./components/course-header";
import { LessonNavigator } from "./components/lesson-navigator";
import { SceneEditor } from "./components/scene-editor";
import { SceneNavigator } from "./components/scene-navigator";
import { useCourseBuilderStore } from "./course-builder-store";
import { useActiveLessonScenes } from "./hooks/use-active-lesson-scenes";

interface CourseBuilderViewProps {
  orgSlug: string;
  notebookId: string | undefined;
  t: NotebookTranslations;
  onExit?: () => void;
}

export function CourseSyncWatcher({ courseId }: { courseId: string }) {
  useCourseSync({ courseId });
  return null;
}

export function CourseBuilderLayoutView({
  header,
  followBanner,
  lessonNavigator,
  sceneNavigator,
  sceneEditor,
}: {
  header: ReactNode;
  followBanner?: ReactNode;
  lessonNavigator: ReactNode;
  sceneNavigator: ReactNode;
  sceneEditor: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-neutral-950">
      {header}
      {followBanner}
      <div className="border-hairline border-b-2 dark:border-neutral-800">
        {lessonNavigator}
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="border-hairline flex w-[260px] shrink-0 flex-col border-r-2 bg-white dark:border-neutral-800 dark:bg-neutral-950">
          {sceneNavigator}
        </div>
        <div className="bg-ground-soft flex min-w-0 flex-1 flex-col dark:bg-neutral-950/50">
          {sceneEditor}
        </div>
      </div>
    </div>
  );
}

export function CourseBuilderView({
  orgSlug,
  notebookId,
  t,
  onExit,
}: CourseBuilderViewProps) {
  const courseId = useCourseBuilderStore((s) => s.course?.id);
  const activeLessonId = useCourseBuilderStore((s) => s.activeLesson?.id);
  const scenesQuery = useActiveLessonScenes(activeLessonId);
  const scenes = scenesQuery.data ?? [];

  if (!courseId) return null;

  return (
    <SessionAwareRoom name={`course-meta-${courseId}`} kind="course-metadata">
      <CourseSyncWatcher courseId={courseId} />
      <CourseBuilderLayoutView
        header={<CourseHeader t={t} orgSlug={orgSlug} onExit={onExit} />}
        followBanner={<AgentFollowBanner t={t} />}
        lessonNavigator={<LessonNavigator t={t} />}
        sceneNavigator={
          <SceneNavigator
            t={t}
            notebookId={notebookId}
            scenes={scenes}
            isScenesLoading={scenesQuery.isLoading}
          />
        }
        sceneEditor={<SceneEditor orgSlug={orgSlug} t={t} scenes={scenes} />}
      />
    </SessionAwareRoom>
  );
}
