"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { toast } from "sonner";

import { useSceneListCacheMutations } from "@/features/notebook/course-builder/hooks/use-scene-list-cache-mutations";

import { useNotebookSourcesIngesting } from "../../sources/hooks/use-notebook-sources-ingesting";
import { useCourseBuilderStore } from "../course-builder-store";
import { authorEditedCourse } from "../hooks/author-attention";
import { SceneNavigatorView } from "./scene-navigator-view";

type LessonScene = RouterOutputs["scene"]["getLessonScenes"][number];

interface SceneNavigatorProps {
  t: NotebookTranslations;
  notebookId: string | undefined;
  scenes: LessonScene[];
  isScenesLoading: boolean;
}

export function SceneNavigator({
  t,
  notebookId,
  scenes,
  isScenesLoading,
}: SceneNavigatorProps) {
  const activeLessonId = useCourseBuilderStore(
    (state) => state.activeLesson?.id,
  );
  const courseId = useCourseBuilderStore((state) => state.course?.id);
  const activeSceneId = useCourseBuilderStore((state) => state.activeScene?.id);
  const setActiveScene = useCourseBuilderStore((state) => state.setActiveScene);
  const sourcesIngesting = useNotebookSourcesIngesting(notebookId);
  const mutations = useSceneListCacheMutations({
    lessonId: activeLessonId,
    courseId,
    setActiveScene,
    onDeleteFailed: (message) =>
      toast.error(message || t.studio.courseBuilder.deleteSceneFailed),
  });

  return (
    <SceneNavigatorView
      t={t}
      activeLessonId={activeLessonId}
      activeSceneId={activeSceneId}
      scenes={scenes}
      isScenesLoading={isScenesLoading}
      onSelectScene={setActiveScene}
      onRepairSelection={(scene) => setActiveScene(scene, "system")}
      outdatedIndicators={sourcesIngesting ? "hidden" : "visible"}
      {...(activeLessonId
        ? {
            mode: "editable" as const,
            actions: {
              create: (title, kind) => {
                authorEditedCourse();
                mutations.createScene.mutate({
                  lessonId: activeLessonId,
                  title,
                  kind,
                });
              },
              clone: (sceneId) => {
                authorEditedCourse();
                mutations.cloneScene.mutate({ sceneId });
              },
              delete: async (sceneId) => {
                authorEditedCourse();
                try {
                  const result = await mutations.deleteScene.mutateAsync({
                    sceneIds: [sceneId],
                  });
                  return result.success;
                } catch {
                  return false;
                }
              },
              reorder: (sceneIds) => {
                authorEditedCourse();
                mutations.reorderScenes.mutate({
                  lessonId: activeLessonId,
                  sceneIds,
                });
              },
              isCreating: mutations.createScene.isPending,
              isDeleting: mutations.deleteScene.isPending,
            },
          }
        : { mode: "readonly" as const })}
    />
  );
}
