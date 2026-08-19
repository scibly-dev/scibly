"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";

import { routes } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@scibly/ui/components/resizable";
import { ArrowLeft, CheckCircle2, Edit2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import "@/shared/content/editor/styles/base-editor.css";

import { RightSidebar } from "../../../../scenes/editor/components/right-sidebar";
import { SceneEditorCanvas } from "../../../../scenes/editor/components/scene-editor-canvas";
import { SceneFlowSidebar } from "../../../../scenes/editor/components/scene-flow-sidebar";

export type Scene = RouterOutputs["scene"]["getLessonScenes"][number];
export type Lesson = RouterOutputs["course"]["getLesson"];

interface LessonBuilderProps {
  courseId: string;
  lessonId: string;
  orgSlug: string;
  initialScenes: Scene[];
  lesson: RouterOutputs["course"]["getLesson"];
}

import useEventListener from "@scibly/lib/hooks/use-event-listener";
import { SCENE_ID_QUERY_PARAM } from "@scibly/routes";
import { useSearchParams } from "next/navigation";

import { api } from "@/shared/api/trpc/client";
import { useCourseSync } from "@/shared/content/course/hooks/use-course-sync";
import { useSaveState } from "@/shared/ui/hooks/use-save-state";
import { useSyncedState } from "@/shared/ui/hooks/use-synced-state";

import { LessonSheet } from "../../../admin/components/lesson-sheet";
import { type LessonMetadataUpdateVariables } from "../../../admin/hooks/use-lesson-metadata-form";

function useLessonBuilderState(props: LessonBuilderProps) {
  const { data: queryScenes } = api.scene.getLessonScenes.useQuery(
    { lessonId: props.lessonId },
    { initialData: props.initialScenes },
  );
  const { data: queryLesson } = api.course.getLesson.useQuery(
    { courseId: props.courseId, lessonId: props.lessonId },
    { initialData: props.lesson },
  );
  const sceneIdParam = useSearchParams().get(SCENE_ID_QUERY_PARAM);
  const [scenes, setScenes] = useSyncedState<Scene[]>(
    props.initialScenes,
    queryScenes,
  );
  const [lessonSheetOpen, setLessonSheetOpen] = useState(false);
  const initialSceneId =
    sceneIdParam &&
    props.initialScenes.some((scene) => scene.id === sceneIdParam)
      ? sceneIdParam
      : props.initialScenes[0]?.id || "";
  const [activeSceneId, setActiveSceneId] = useState(initialSceneId);
  const isSaving = useSaveState((state) => state.pendingSaves > 0);
  const triggerDummySave = useSaveState((state) => state.triggerDummySave);
  const provider = useCourseSync({
    courseId: props.courseId,
    lessonId: props.lessonId,
  });
  useEffect(() => {
    if (
      activeSceneId &&
      scenes.length > 0 &&
      !scenes.some((scene) => scene.id === activeSceneId)
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveSceneId(scenes[0].id);
    }
  }, [scenes, activeSceneId]);
  useEventListener("keydown", (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "s") {
      event.preventDefault();
      triggerDummySave();
    }
  });
  const activeScene =
    scenes.find((scene) => scene.id === activeSceneId) || scenes[0];
  const updateScene = (id: string, updates: Partial<Scene>) =>
    setScenes(
      scenes.map((scene) =>
        scene.id === id ? { ...scene, ...updates } : scene,
      ),
    );
  return {
    scenes,
    setScenes,
    activeSceneId,
    setActiveSceneId,
    activeScene,
    updateScene,
    isSaving,
    provider,
    activeLesson: queryLesson ?? props.lesson,
    lessonSheetOpen,
    setLessonSheetOpen,
  };
}

export const BuilderHeader = ({
  orgSlug,
  courseId,
  title,
  isSaving,
}: {
  orgSlug: string;
  courseId: string;
  title: string;
  isSaving: boolean;
}) => {
  return (
    <header className="border-hairline flex h-14 shrink-0 items-center justify-between border-b-2 bg-white px-4 dark:border-neutral-800/60 dark:bg-neutral-950">
      <div className="flex items-center gap-3">
        <Link href={routes.app.profile.org(orgSlug).courses.detail(courseId)}>
          <Button
            variant="ghost"
            size="icon"
            className="text-ink-muted hover:text-ink h-8 w-8 rounded-[10px]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-ink text-[14px] font-semibold dark:text-neutral-100">
          {title}
        </h1>
        <span className="border-hairline bg-ground text-ink-muted rounded-[10px] border-2 px-2 py-0.5 text-[11px] font-semibold dark:bg-neutral-900">
          Draft
        </span>
        <div className="text-ink-faint flex items-center gap-1.5 text-[12px]">
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              All changes saved
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export const LessonSettingsHeader = ({
  courseId,
  state,
}: {
  courseId: string;
  state: ReturnType<typeof useLessonBuilderState>;
}) => {
  return (
    <div className="border-hairline z-10 flex h-12 shrink-0 items-center justify-between border-b-2 bg-white px-4 dark:border-neutral-800/60 dark:bg-neutral-950">
      <span className="text-ink-faint text-[10px] font-bold tracking-wider uppercase">
        Lesson Settings
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 rounded-[10px]"
        onClick={() => state.setLessonSheetOpen(true)}
      >
        <Edit2 className="h-3.5 w-3.5" /> Edit lesson
      </Button>
      <LessonSheet
        courseId={courseId}
        open={state.lessonSheetOpen}
        onOpenChange={state.setLessonSheetOpen}
        lesson={state.activeLesson}
        onUpdateSuccess={(variables: LessonMetadataUpdateVariables) =>
          state.provider.sendStateless(
            JSON.stringify({ type: "update_lesson", updates: variables }),
          )
        }
      />
    </div>
  );
};

export function LessonBuilder({
  courseId,
  lessonId,
  orgSlug,
  initialScenes,
  lesson,
}: LessonBuilderProps) {
  const state = useLessonBuilderState({
    courseId,
    lessonId,
    orgSlug,
    initialScenes,
    lesson,
  });
  const { scenes, setScenes, activeSceneId, setActiveSceneId, activeScene } =
    state;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-white font-sans dark:bg-neutral-950">
      <BuilderHeader
        orgSlug={orgSlug}
        courseId={courseId}
        title={lesson.title}
        isSaving={state.isSaving}
      />

      {/* Main Workspace */}
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1 bg-white dark:bg-neutral-950"
      >
        <ResizablePanel defaultSize="20%" minSize="15%" maxSize="30%">
          <SceneFlowSidebar
            lessonId={lessonId}
            scenes={scenes}
            setScenes={setScenes}
            activeSceneId={activeSceneId}
            setActiveSceneId={setActiveSceneId}
          />
        </ResizablePanel>

        <ResizableHandle className="bg-hairline w-px cursor-col-resize transition-all hover:w-1 hover:bg-[#0066FF]/50 hover:delay-100 active:w-1 active:bg-[#0066FF] dark:bg-neutral-800/60" />

        <ResizablePanel defaultSize="50%" minSize="40%">
          <main className="bg-ground flex h-full flex-col overflow-hidden dark:bg-neutral-900/50">
            <LessonSettingsHeader courseId={courseId} state={state} />

            <div className="relative flex flex-1 overflow-hidden">
              <SceneEditorCanvas
                lesson={state.activeLesson}
                scene={activeScene}
                totalScenes={scenes.length}
                currentIndex={scenes.findIndex((s) => s.id === activeScene.id)}
                onSceneUpdate={state.updateScene}
              />
            </div>
          </main>
        </ResizablePanel>

        <ResizableHandle className="bg-hairline w-px cursor-col-resize transition-all hover:w-1 hover:bg-[#0066FF]/50 hover:delay-100 active:w-1 active:bg-[#0066FF] dark:bg-neutral-800/60" />

        <ResizablePanel defaultSize="30%" minSize="25%" maxSize="45%">
          <aside className="relative z-10 flex h-full w-full shrink-0 flex-col bg-white dark:bg-neutral-950">
            <RightSidebar
              courseId={courseId}
              orgSlug={orgSlug}
              lesson={state.activeLesson}
              scene={activeScene}
              scenes={scenes}
              sceneIndex={scenes.findIndex((s) => s.id === activeScene.id)}
              onSceneUpdate={state.updateScene}
            />
          </aside>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
