import type { GuideCharacterReaction } from "@/shared/content/editor/blocks/guide-character/utils/guide-character-reactions";
import type { LearningPlayerTranslations } from "../../i18n/learning-player.types";
import type { PlayerLesson } from "../../utils/player-types";
import type { SceneContentQueryResult } from "../utils/use-scene-content";

import { AnimatePresence } from "framer-motion";

import { type ANIMATION_VARIANTS } from "../../utils/player-helpers";
import { LessonScenePanel } from "./lesson-scene-panel";
import { LessonScenePanelSkeleton } from "./lesson-scene-panel-skeleton";
import { SceneContent } from "./scene-content";
import { SceneViewportShell } from "./scene-viewport-shell";

export function LessonSceneViewport({
  sceneContent,
  currentScene,
  variant,
  guideReaction,
  t,
}: {
  sceneContent: SceneContentQueryResult;
  currentScene: PlayerLesson["scenes"][number];
  variant: (typeof ANIMATION_VARIANTS)[keyof typeof ANIMATION_VARIANTS];
  guideReaction: GuideCharacterReaction;
  t: LearningPlayerTranslations;
}) {
  return (
    <SceneViewportShell>
      {sceneContent.isLoading ? (
        <LessonScenePanelSkeleton />
      ) : sceneContent.error ? (
        <div
          role="alert"
          className="mx-auto flex max-w-sm flex-col items-center gap-4 text-center"
        >
          <p className="text-sm font-medium text-red-700">
            {t.navigation.sceneLoadError}
          </p>
          <button
            type="button"
            onClick={() => void sceneContent.refetch()}
            disabled={sceneContent.isRefetching}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sceneContent.isRefetching
              ? t.navigation.saving
              : t.navigation.tryAgain}
          </button>
        </div>
      ) : sceneContent.learnerContent ? (
        <div className="relative mx-auto w-full max-w-2xl shrink-0">
          <AnimatePresence initial={false}>
            <LessonScenePanel key={currentScene.id} variant={variant}>
              <SceneContent
                learnerContent={sceneContent.learnerContent}
                guideReaction={guideReaction}
              />
            </LessonScenePanel>
          </AnimatePresence>
        </div>
      ) : null}
    </SceneViewportShell>
  );
}
