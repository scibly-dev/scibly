"use client";

import type { PlayerScene } from "@/features/learning/course-player/client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { PlayerNavigationFooter } from "@/features/learning/course-player/client";
import { PlayerTopBar } from "@/features/learning/course-player/client";
import { SceneViewportShell } from "@/features/learning/course-player/client";
import { SPAnimation } from "@/features/learning/course-player/client";
import {
  type ANIMATION_VARIANTS,
  getSceneDesignVars,
} from "@/features/learning/course-player/client";
import { useTranslation } from "@/i18n/hooks/use-translation";
import { type LessonDesign } from "@/shared/content/course/course-validation";
import { useQuestionBlockStore } from "@/shared/content/editor/assessment/grading/question-block-store";
import { getEffectiveSceneSp } from "@/shared/content/learning/scene-sp";

import { type Scene } from "../../../../../lessons/builder/components/lesson-builder";
import { DEVICE_FRAME } from "./preview-devices";
import { ScenePreviewRenderer } from "./scene-preview-renderer";

interface DevicePreviewProps {
  design: LessonDesign;
  scene: Scene;
  sceneIndex: number;
  totalScenes: number;
  scale: number;
  animationKey: number;
  variant: (typeof ANIMATION_VARIANTS)[keyof typeof ANIMATION_VARIANTS];
  previewMode: "mobile" | "desktop";
  currentDevice: { width: number; height: number; rounded: number };
}

export function DevicePreview({
  design,
  scene,
  sceneIndex,
  totalScenes,
  scale,
  animationKey,
  variant,
  previewMode,
  currentDevice,
}: DevicePreviewProps) {
  const { translations: t } = useTranslation("learningPlayer");
  const [showSP, setShowSP] = useState(false);

  const questionBlocks = useQuestionBlockStore((s) => s.questionBlocks);
  const checkIfAllAnswered = useQuestionBlockStore((s) => s.checkIfAllAnswered);
  const allAnswered = checkIfAllAnswered(questionBlocks).allAnswered;

  const playerScene: PlayerScene = {
    id: scene.id,
    animation: scene.animation ?? "FADE",
    design,
    kind: questionBlocks.size > 0 ? "assessment" : "content",
  };

  const buttonLabel =
    questionBlocks.size > 0
      ? t.navigation.check
      : sceneIndex >= totalScenes - 1
        ? t.navigation.complete
        : t.navigation.next;

  const handlePreviewNext = () => {
    const sceneSp = getEffectiveSceneSp(scene.sp);
    if (sceneSp > 0) {
      setShowSP(true);
      setTimeout(() => setShowSP(false), 1500);
    }
  };

  return (
    /* Inset into a bezel rather than flush: flush, the content's square
       corners fight the frame's rounded clip and show a doubled edge. */
    <div
      className="group border-edge relative flex shrink-0 origin-center items-center justify-center border-2 bg-white shadow-[0_4px_0_0_var(--color-edge)] transition-all duration-300 ease-out dark:border-neutral-700 dark:bg-neutral-950 dark:shadow-none"
      style={{
        width: currentDevice.width + DEVICE_FRAME * 2,
        height: currentDevice.height + DEVICE_FRAME * 2,
        borderRadius: currentDevice.rounded,
        transform: `scale(${scale})`,
        ...getSceneDesignVars(playerScene),
      }}
    >
      {/* No backdrop-filter inside: the scaled frame is its backdrop root, so
          blur would sample through the rounded corners as a square wedge
          instead of the scene's own background. */}
      <div
        className="border-hairline @container relative overflow-hidden border bg-white **:[backdrop-filter:none] dark:border-neutral-800 dark:bg-neutral-950"
        style={{
          width: currentDevice.width,
          height: currentDevice.height,
          borderRadius: currentDevice.rounded - DEVICE_FRAME,
        }}
      >
        {previewMode === "mobile" ? (
          <div className="pointer-events-none absolute inset-x-0 top-2 z-50 flex justify-center">
            <div className="bg-ink h-6 w-28 rounded-full" />
          </div>
        ) : null}

        <div className="absolute inset-0 z-0 flex h-full w-full flex-col overflow-hidden font-sans">
          <PlayerTopBar
            currentSceneIndex={sceneIndex}
            totalScenes={totalScenes}
            currentScene={playerScene}
            onClose={() => {}}
            showMenu={false}
            onToggleMenu={() => {}}
            isAnonymous={false}
            t={t}
            className={previewMode === "mobile" ? "pt-10" : undefined}
          />
          <div className="relative min-h-0 flex-1">
            <SceneViewportShell>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`device-${animationKey}`}
                  initial={animationKey > 0 ? variant.initial : false}
                  animate={variant.animate}
                  exit={variant.exit}
                  transition={variant.transition}
                  className="relative mx-auto w-full max-w-2xl shrink-0"
                >
                  <ScenePreviewRenderer
                    scene={scene}
                    layoutClass="flex flex-col justify-start w-full max-w-4xl mx-auto"
                  />
                </motion.div>
              </AnimatePresence>
            </SceneViewportShell>
            <PlayerNavigationFooter
              currentScene={playerScene}
              allAnswered={allAnswered}
              isPending={false}
              buttonLabel={buttonLabel}
              onNext={handlePreviewNext}
              canGoBack={sceneIndex > 0}
              backLabel={t.navigation.goBack}
              onBack={() => {}}
              isAnonymous={false}
              feedbackSummary={null}
              t={t}
            />
          </div>
        </div>

        <SPAnimation show={showSP} sp={getEffectiveSceneSp(scene.sp)} />
      </div>
    </div>
  );
}
