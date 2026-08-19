"use client";

import type { GuideCharacterReaction } from "@/shared/content/editor/blocks/guide-character/utils/guide-character-reactions";
import type { LearningPlayerTranslations } from "../../i18n/learning-player.types";
import type { PlayerScene } from "../../utils/player-types";
import type { SceneContentQueryResult } from "../utils/use-scene-content";
import type { useLessonProgression } from "../utils/useLessonProgression";

import { useMemo } from "react";

import { reactionFromSceneFeedback } from "@/shared/content/editor/blocks/guide-character/utils/guide-character-reactions";

import {
  ANIMATION_VARIANTS,
  type getLessonSceneProgress,
  getSceneDesignVars,
} from "../../utils/player-helpers";
import { PLAYER_VIEWPORT_LAYER } from "../../utils/viewport-layer";
import { LessonSceneViewport } from "./lesson-scene-viewport";
import { PitchScene } from "./pitch-scene";
import { PlayerExitModal } from "./player-exit-modal";
import { PlayerNavigationFooter } from "./player-navigation-footer";
import { PlayerTopBar } from "./player-top-bar";
import { SPAnimation } from "./sp-animation";

type LessonProgression = ReturnType<typeof useLessonProgression>;

function LessonPlayerStageComponent({
  sceneContent,
  currentScene,
  variant,
  guideReaction,
  scene,
  chrome,
  submission,
  actions,
  isAnonymous,
  t,
}: {
  sceneContent: SceneContentQueryResult;
  currentScene: PlayerScene;
  variant: (typeof ANIMATION_VARIANTS)[keyof typeof ANIMATION_VARIANTS];
  guideReaction: GuideCharacterReaction;
  scene: LessonProgression["scene"];
  chrome: LessonProgression["chrome"];
  submission: LessonProgression["submission"];
  actions: LessonProgression["actions"];
  isAnonymous?: boolean;
  t: LearningPlayerTranslations;
}) {
  const isPitch = currentScene.kind === "pitch";
  return (
    <div className="relative min-h-0 flex-1">
      {isPitch ? (
        <PitchScene />
      ) : (
        <LessonSceneViewport
          sceneContent={sceneContent}
          currentScene={currentScene}
          variant={variant}
          guideReaction={guideReaction}
          t={t}
        />
      )}
      {isPitch || sceneContent.learnerContent ? (
        <PlayerNavigationFooter
          currentScene={currentScene}
          allAnswered={chrome.canAdvance}
          isPending={submission.isPending}
          submissionError={submission.submissionError}
          buttonLabel={chrome.buttonLabel}
          onNext={actions.handleNext}
          canGoBack={scene.canGoBack}
          backLabel={t.navigation.goBack}
          onBack={actions.handlePrevious}
          isAnonymous={isAnonymous}
          feedbackSummary={scene.sceneFeedbackSummary}
          t={t}
        />
      ) : null}
    </div>
  );
}

export function LessonPlayerShell({
  onExit,
  canExit = true,
  isAnonymous,
  progression,
  currentScene,
  sceneContent,
  exitModalSceneProgress,
  t,
}: {
  onExit: () => void;
  canExit?: boolean;
  isAnonymous?: boolean;
  progression: LessonProgression;
  currentScene: PlayerScene;
  sceneContent: SceneContentQueryResult;
  exitModalSceneProgress: ReturnType<typeof getLessonSceneProgress>;
  t: LearningPlayerTranslations;
}) {
  const { scene, chrome, submission, actions } = progression;
  const variant = ANIMATION_VARIANTS[currentScene.animation ?? "FADE"];
  const guideReaction = useMemo(
    () =>
      reactionFromSceneFeedback(
        scene.sceneFeedbackSummary?.status,
        chrome.isCelebrating,
      ),
    [scene.sceneFeedbackSummary?.status, chrome.isCelebrating],
  );

  return (
    /* @container: the scene sizes itself against this screen rather than the
       window, so the builder's device preview lays out like a real phone. */
    <div
      {...PLAYER_VIEWPORT_LAYER}
      className="@container fixed inset-0 z-100 flex flex-col overflow-hidden font-sans"
      style={getSceneDesignVars(currentScene)}
    >
      <PlayerTopBar
        currentSceneIndex={scene.sceneIndex}
        totalScenes={scene.totalScenes}
        currentScene={currentScene}
        onClose={actions.showExit}
        canExit={canExit}
        showMenu={chrome.showMenu}
        onToggleMenu={actions.toggleMenu}
        isAnonymous={isAnonymous}
        t={t}
      />
      <LessonPlayerStageComponent
        sceneContent={sceneContent}
        currentScene={currentScene}
        variant={variant}
        guideReaction={guideReaction}
        scene={scene}
        chrome={chrome}
        submission={submission}
        actions={actions}
        isAnonymous={isAnonymous}
        t={t}
      />
      <SPAnimation show={chrome.showSPAnimation} sp={chrome.lastEarnedSP} />
      <PlayerExitModal
        show={chrome.showExitConfirm}
        onStay={actions.hideExit}
        onExit={onExit}
        t={t}
        scenesCompleted={exitModalSceneProgress.completed}
        scenesTotal={exitModalSceneProgress.total}
      />
    </div>
  );
}
