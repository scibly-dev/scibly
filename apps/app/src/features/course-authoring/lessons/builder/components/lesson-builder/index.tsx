"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";

import { routes } from "@scibly/routes";
import { Button } from "@scibly/ui/components/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@scibly/ui/components/resizable";
import {
  ArrowLeft,
  CheckCircle2,
  Edit2,
  Loader2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import "@/shared/content/editor/styles/base-editor.css";

import { RightSidebar } from "../../../../scenes/editor/components/right-sidebar";
import { DesignTab } from "../../../../scenes/editor/components/right-sidebar/design-tab";
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
  const [focusMode, setFocusMode] = useState(false);
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
  useEventListener("keydown", (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "s") {
      event.preventDefault();
      triggerDummySave();
    }
  });
  // Derived, not synced through an effect: the fallback for a scene deleted
  // under us has to land in this render.
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
    activeSceneId: activeScene?.id ?? "",
    setActiveSceneId,
    activeScene,
    updateScene,
    isSaving,
    provider,
    activeLesson: queryLesson ?? props.lesson,
    lessonSheetOpen,
    setLessonSheetOpen,
    focusMode,
    setFocusMode,
  };
}

export const BuilderHeader = ({
  orgSlug,
  courseId,
  title,
  isSaving,
  focusMode,
  onEditLesson,
  onToggleFocusMode,
}: {
  orgSlug: string;
  courseId: string;
  title: string;
  isSaving: boolean;
  focusMode: boolean;
  onEditLesson: () => void;
  onToggleFocusMode: () => void;
}) => {
  return (
    <header className="border-hairline flex h-14 shrink-0 items-center gap-3 border-b-2 bg-white px-4 dark:border-neutral-800/60 dark:bg-neutral-950">
      <Link href={routes.app.profile.org(orgSlug).courses.detail(courseId)}>
        <Button
          variant="ghost"
          size="icon"
          className="text-ink-muted hover:text-ink h-8 w-8 rounded-[10px]"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <h1 className="text-ink truncate text-[14px] font-semibold dark:text-neutral-100">
        {title}
      </h1>
      <span className="border-hairline bg-ground text-ink-muted shrink-0 rounded-[10px] border-2 px-2 py-0.5 text-[11px] font-semibold dark:bg-neutral-900">
        Draft
      </span>
      <div className="text-ink-faint flex shrink-0 items-center gap-1.5 text-[12px]">
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
      {/* Lesson settings used to own a second full-width bar under this one.
          Two bars, each a label at one edge and a control at the other, is all
          gap on a wide display — one bar with a trailing action is not. */}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFocusMode}
          title={focusMode ? "Show side panels" : "Hide side panels"}
          className="text-ink-muted hover:text-ink h-8 gap-1.5 rounded-[10px]"
        >
          {focusMode ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
          {focusMode ? "Exit focus" : "Focus"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onEditLesson}
          className="h-8 gap-1.5 rounded-[10px]"
        >
          <Edit2 className="h-3.5 w-3.5" /> Edit lesson
        </Button>
      </div>
    </header>
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
        title={state.activeLesson.title}
        isSaving={state.isSaving}
        focusMode={state.focusMode}
        onEditLesson={() => state.setLessonSheetOpen(true)}
        onToggleFocusMode={() => state.setFocusMode(!state.focusMode)}
      />

      <LessonSheet
        courseId={courseId}
        open={state.lessonSheetOpen}
        onOpenChange={state.setLessonSheetOpen}
        lesson={state.activeLesson}
        designSlot={
          <DesignTab courseId={courseId} lesson={state.activeLesson} />
        }
      />

      {/* Was 20/50/30. The rail only holds scene rows and the inspector only
          holds a handful of fields, so at 1728px both were padding the middle
          panel out of the width its editors actually need. */}
      <ResizablePanelGroup
        orientation="horizontal"
        className="flex-1 bg-white dark:bg-neutral-950"
      >
        {state.focusMode ? null : (
          <>
            <ResizablePanel
              id="scene-rail"
              defaultSize="18%"
              minSize="14%"
              maxSize="30%"
            >
              <SceneFlowSidebar
                lessonId={lessonId}
                scenes={scenes}
                setScenes={setScenes}
                activeSceneId={activeSceneId}
                setActiveSceneId={setActiveSceneId}
              />
            </ResizablePanel>

            <ResizableHandle className="bg-hairline w-px cursor-col-resize transition-all hover:w-1 hover:bg-[#0066FF]/50 hover:delay-100 active:w-1 active:bg-[#0066FF] dark:bg-neutral-800/60" />
          </>
        )}

        <ResizablePanel id="canvas" defaultSize="56%" minSize="40%">
          <div className="bg-ground relative flex h-full overflow-hidden dark:bg-neutral-900/50">
            <SceneEditorCanvas
              lesson={state.activeLesson}
              scene={activeScene}
              totalScenes={scenes.length}
              currentIndex={scenes.findIndex((s) => s.id === activeScene.id)}
              onSceneUpdate={state.updateScene}
            />
          </div>
        </ResizablePanel>

        {state.focusMode ? null : (
          <>
            <ResizableHandle className="bg-hairline w-px cursor-col-resize transition-all hover:w-1 hover:bg-[#0066FF]/50 hover:delay-100 active:w-1 active:bg-[#0066FF] dark:bg-neutral-800/60" />

            <ResizablePanel
              id="inspector"
              defaultSize="26%"
              minSize="20%"
              maxSize="40%"
            >
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
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
