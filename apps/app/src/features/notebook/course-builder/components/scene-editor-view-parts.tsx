"use client";

import type { SceneEditorPresentation, SceneEditorScene } from "./scene-editor";

import { cn } from "@scibly/ui/utils";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { createElement, useRef } from "react";

import { SceneSourcesInfo } from "@/shared/content/course/components/scene-sources-info";
import { useInlineEdit } from "@/shared/ui/hooks/use-inline-edit";

import { sceneEditorPane } from "./scene-editor";

type SceneRef = { id: string; title: string };

const sceneStepButton =
  "border-hairline text-ink-muted ease-press hover:border-edge hover:text-ink flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border-2 bg-white shadow-[0_2px_0_0_var(--color-lip)] transition-[translate,box-shadow,border-color,color] duration-100 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:shadow-none";

export const SceneTitle = ({
  scene,
  displayTitle,
  index,
  count,
  update,
}: {
  scene: SceneRef;
  displayTitle: string;
  index: number;
  count: number;
  update: (id: string, title: string) => void;
}) => {
  const editingRef = useRef<SceneRef | null>(null);
  const edit = useInlineEdit<string>({
    onSave: (value) => {
      const current = editingRef.current;
      const title = value.trim();
      if (current && title && title !== current.title)
        update(current.id, title);
    },
  });
  if (edit.isEditing)
    return (
      <input
        autoFocus
        type="text"
        value={edit.value}
        onChange={(event) => edit.setValue(event.target.value)}
        onBlur={edit.save}
        onKeyDown={edit.onKeyDown}
        className="border-edge text-ink min-w-0 flex-1 rounded-xl border-2 bg-white px-2 py-1 text-center text-lg font-bold focus:border-[#b9d7ff] focus:ring-4 focus:ring-[#0066FF]/15 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
      />
    );
  return (
    <button
      type="button"
      onClick={() => {
        editingRef.current = scene;
        edit.start(scene.title);
      }}
      className={cn(
        "group relative flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl px-2 py-1 text-center transition-colors",
        "hover:bg-ground dark:hover:bg-neutral-800",
      )}
    >
      <span className="text-ink truncate px-12 text-lg font-bold dark:text-neutral-100">
        {displayTitle}
      </span>
      <span className="absolute right-2 shrink-0 rounded-full bg-[#eff5ff] px-2 py-0.5 text-[10px] font-bold text-[#0b52cc] dark:bg-blue-900/50 dark:text-blue-400">
        {index + 1} / {count}
      </span>
    </button>
  );
};

export function SceneEditorHeader({
  scenes,
  activeScene,
  activeIndex,
  displayTitle,
  labels,
  presentation,
  select,
  update,
}: {
  scenes: readonly SceneEditorScene[];
  activeScene: SceneRef;
  activeIndex: number;
  displayTitle: string;
  labels: { previousScene: string; nextScene: string; openFullEditor: string };
  presentation: SceneEditorPresentation;
  select: (scene: SceneRef) => void;
  update: (id: string, title: string) => void;
}) {
  const move = (offset: number) => {
    const scene = scenes[activeIndex + offset];
    if (scene) select(scene);
  };
  return (
    <div className="flex items-center justify-between px-3 py-1">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          disabled={activeIndex <= 0}
          onClick={() => move(-1)}
          className={sceneStepButton}
          title={labels.previousScene}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <SceneTitle
          scene={activeScene}
          displayTitle={displayTitle}
          index={activeIndex}
          count={scenes.length}
          update={update}
        />
        <button
          type="button"
          disabled={activeIndex >= scenes.length - 1}
          onClick={() => move(1)}
          className={sceneStepButton}
          title={labels.nextScene}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {presentation.type === "production" && presentation.fullEditorUrl ? (
        <a
          href={presentation.fullEditorUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={labels.openFullEditor}
          className="text-ink-faint hover:bg-ground hover:text-ink ml-2 flex h-7 items-center gap-1 rounded-[10px] px-2 text-[11px] font-medium transition-colors dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : null}
    </div>
  );
}

function editorElement(
  presentation: SceneEditorPresentation,
  scene: SceneRef,
  previewHtml: string | undefined,
) {
  const common = {
    key: scene.id,
    variant: { type: "author" as const },
    wrapperClassName:
      "flex flex-col min-h-[280px] w-full pl-10 pr-4 pt-2 pb-12",
    visibilityOptions: { topBar: { enabled: false } },
  };
  return presentation.type === "showcase"
    ? createElement(sceneEditorPane, {
        ...common,
        mode: "local",
        initialContent: previewHtml ?? "",
        commandRef: presentation.commandRef,
        capabilities: { mediaUploads: "disabled" },
        shouldSetStoreEditor: false,
      })
    : createElement(sceneEditorPane, {
        ...common,
        mode: "collab",
        documentId: scene.id,
        capabilities: { mediaUploads: "enabled" },
      });
}

export function SceneEditorBody({
  scene,
  data,
  presentation,
  labels,
}: {
  scene: SceneRef;
  data: SceneEditorScene | undefined;
  presentation: SceneEditorPresentation;
  labels: {
    demoLimitationsBanner: string;
    sceneSources: string;
    moreSources: string;
  };
}) {
  return (
    <>
      {presentation.type === "showcase" ? (
        <div
          role="status"
          className="mx-3 mb-2 flex items-start gap-2.5 rounded-xl border-2 border-[#b9d7ff] bg-[#eff5ff] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#0c3f88] dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-100"
        >
          <span
            aria-hidden
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#dcebff] text-[11px] font-semibold text-[#0b52cc] dark:bg-sky-900/80 dark:text-sky-200"
          >
            ✦
          </span>
          <p className="min-w-0 pt-0.5">{labels.demoLimitationsBanner}</p>
        </div>
      ) : null}
      {data?.sources && data.sources.length > 0 ? (
        <div className="border-hairline border-b-2 px-3 py-2 dark:border-neutral-800">
          <SceneSourcesInfo
            sources={data.sources}
            label={labels.sceneSources}
            moreSourcesLabel={labels.moreSources}
          />
        </div>
      ) : null}
      <div className="custom-scrollbar @container flex min-h-0 flex-1 flex-col overflow-y-auto bg-white dark:bg-neutral-950">
        {editorElement(presentation, scene, data?.previewHtml)}
      </div>
    </>
  );
}
