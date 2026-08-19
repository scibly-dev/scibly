"use client";

import type { Ref } from "react";
import type {
  EditorProps,
  MountedEditorCommands,
} from "@/features/course-authoring/client";
import type { RouterOutputs } from "@/shared/api/trpc/client";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { routes } from "@scibly/routes";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback } from "react";

import { api } from "@/shared/api/trpc/client";
import { type SceneSourceInfo } from "@/shared/content/course/components/scene-sources-info";

import { useCourseBuilderStore } from "../course-builder-store";
import { authorEditedCourse } from "../hooks/author-attention";
import { SceneEditorBody, SceneEditorHeader } from "./scene-editor-view-parts";

export const sceneEditorPane = dynamic<EditorProps>(
  () =>
    import("@/features/course-authoring/client").then(
      (courseAuthoring) => courseAuthoring.AuthoringEditor,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] flex-1 items-center justify-center">
        <div className="animate-spin">
          <Loader2 className="text-ink-faint h-5 w-5" />
        </div>
      </div>
    ),
  },
);

type LessonScene = RouterOutputs["scene"]["getLessonScenes"][number];

export type SceneEditorScene = {
  id: string;
  title: string;
  sources: readonly SceneSourceInfo[];
  previewHtml?: string;
};

export type SceneEditorPresentation =
  | {
      type: "production";
      fullEditorUrl: string | undefined;
    }
  | {
      type: "showcase";
      commandRef: Ref<MountedEditorCommands>;
    };

export function SceneEditorView({
  t,
  scenes,
  activeScene,
  onSelectScene,
  onUpdateSceneTitle,
  onAuthorInput,
  presentation,
}: {
  t: NotebookTranslations;
  scenes: readonly SceneEditorScene[];
  activeScene: { id: string; title: string } | undefined;
  onSelectScene: (scene: { id: string; title: string }) => void;
  onUpdateSceneTitle: (sceneId: string, title: string) => void;

  onAuthorInput?: () => void;
  presentation: SceneEditorPresentation;
}) {
  const cb = t.studio.courseBuilder;
  const activeSceneIndex = scenes.findIndex(
    (scene) => scene.id === activeScene?.id,
  );
  const activeSceneData = scenes.find((scene) => scene.id === activeScene?.id);
  if (!activeScene) return null;
  const displayTitle =
    activeScene.title ||
    cb.sceneLabel.replace("{n}", String(activeSceneIndex + 1));

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
      onKeyDownCapture={onAuthorInput}
      onPasteCapture={onAuthorInput}
    >
      <SceneEditorHeader
        scenes={scenes}
        activeScene={activeScene}
        activeIndex={activeSceneIndex}
        displayTitle={displayTitle}
        labels={cb}
        presentation={presentation}
        select={onSelectScene}
        update={onUpdateSceneTitle}
      />
      <SceneEditorBody
        scene={activeScene}
        data={activeSceneData}
        presentation={presentation}
        labels={cb}
      />
    </div>
  );
}

interface SceneEditorProps {
  orgSlug: string;
  t: NotebookTranslations;
  scenes: LessonScene[];
}

export function SceneEditor({ orgSlug, t, scenes }: SceneEditorProps) {
  const utils = api.useUtils();
  const courseId = useCourseBuilderStore((state) => state.course?.id);
  const activeLessonId = useCourseBuilderStore(
    (state) => state.activeLesson?.id,
  );
  const activeScene = useCourseBuilderStore((state) => state.activeScene);
  const setActiveScene = useCourseBuilderStore((state) => state.setActiveScene);
  const { mutate: updateScene } = api.scene.updateScene.useMutation({
    onSuccess: () =>
      void utils.scene.getLessonScenes.invalidate({
        lessonId: activeLessonId ?? "",
      }),
  });
  const updateSceneTitle = useCallback(
    (sceneId: string, title: string) => {
      authorEditedCourse();
      updateScene({ sceneId, updates: { title } });
      if (activeScene?.id === sceneId) {
        setActiveScene({ ...activeScene, title });
      }
    },
    [activeScene, setActiveScene, updateScene],
  );
  const fullEditorUrl =
    courseId && activeLessonId && activeScene
      ? routes.app.profile
          .org(orgSlug)
          .courses.lesson(courseId, activeLessonId, activeScene.id)
      : undefined;

  return (
    <SceneEditorView
      t={t}
      scenes={scenes}
      activeScene={activeScene}
      onSelectScene={setActiveScene}
      onUpdateSceneTitle={updateSceneTitle}
      onAuthorInput={authorEditedCourse}
      presentation={{ type: "production", fullEditorUrl }}
    />
  );
}
