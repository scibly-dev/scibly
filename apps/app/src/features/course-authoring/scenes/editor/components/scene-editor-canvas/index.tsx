"use client";

import { SceneVibe } from "@scibly/db/enums";
import { cn } from "@scibly/ui/utils";

import Editor from "@/features/course-authoring/scenes/editor/authoring-editor";
import { type LessonDesign } from "@/shared/content/course/course-validation";
import { useQuestionBlockStore } from "@/shared/content/editor/assessment/grading/question-block-store";
import { type StyleWithCssVars } from "@/shared/content/learning/scene-design";

import {
  type Lesson,
  type Scene,
} from "../../../../lessons/builder/components/lesson-builder";
import { lessonDesign } from "../right-sidebar/design-tab";
import { TemplateDock } from "./template-dock";

const VIBE_GROUND = {
  [SceneVibe.URGENT]: "bg-red-50 dark:bg-red-950/30",
  [SceneVibe.CALM]: "bg-sky-50 dark:bg-sky-950/30",
  [SceneVibe.PLAYFUL]: "bg-fuchsia-50 dark:bg-fuchsia-950/30",
  [SceneVibe.NEUTRAL]: "bg-ground dark:bg-[#0a0a0b]",
} satisfies Record<SceneVibe, string>;

interface SceneEditorCanvasProps {
  lesson: Lesson;
  scene: Scene;
  totalScenes: number;
  currentIndex: number;
  onSceneUpdate?: (id: string, updates: Partial<Scene>) => void;
}

function editorStyles(design: LessonDesign): StyleWithCssVars {
  return {
    "--editor-bg": design.backgroundColor,
    "--editor-text-color": design.textColor,
    "--editor-heading-color": design.textColor,
    "--editor-font-family": design.fontFamily,
  };
}

export function SceneEditorCanvas({
  lesson,
  scene,
  totalScenes,
  currentIndex,
  onSceneUpdate: _onSceneUpdate,
}: SceneEditorCanvasProps) {
  const vibe = scene.vibe || SceneVibe.NEUTRAL;

  const design = lessonDesign(lesson);
  const customStyles = editorStyles(design);

  const editor = useQuestionBlockStore((s) => s.editor);

  return (
    <main
      className={cn(
        "relative flex min-w-0 flex-1 flex-col transition-colors duration-500",
        VIBE_GROUND[vibe],
      )}
    >
      <div className="no-scrollbar relative z-10 flex w-full flex-1 flex-col items-center justify-center overflow-y-auto p-8 lg:p-12">
        <div
          className="no-scrollbar border-hairline group @container relative flex h-auto max-h-[75vh] min-h-[400px] w-full max-w-[800px] shrink-0 flex-col overflow-y-auto rounded-[20px] border-2 bg-white shadow-[0_4px_0_0_var(--color-edge)] dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none"
          style={{
            ...customStyles,
            backgroundColor: design.backgroundColor,
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-8 z-20 flex justify-center">
            <span className="text-ink-faint text-[11px] font-medium tracking-[0.15em] uppercase dark:text-neutral-500/80">
              Scene {currentIndex + 1} / {totalScenes}
            </span>
          </div>

          <div className="mt-20 flex flex-1 flex-col px-4">
            <Editor
              variant={{ type: "author" }}
              documentId={scene.id}
              wrapperClassName="flex flex-col justify-center w-full h-full"
              visibilityOptions={{
                topBar: { enabled: false },
              }}
            />
          </div>
        </div>
      </div>

      <TemplateDock editor={editor} />
    </main>
  );
}
