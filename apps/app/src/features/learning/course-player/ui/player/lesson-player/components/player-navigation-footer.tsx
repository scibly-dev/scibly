"use client";

import type { StyleWithCssVars } from "@/shared/content/learning/scene-design";
import type { LearningPlayerTranslations } from "../../i18n/learning-player.types";
import type { PlayerScene } from "../../utils/player-types";
import type { SceneFeedbackSummary } from "../utils/scene-feedback-summary";

import { cn } from "@scibly/ui/utils";
import { AnimatePresence, motion } from "framer-motion";

import {
  getSceneDesignVars,
  getScenePrimaryButtonShadowColor,
  getScenePrimaryButtonStyle,
} from "../../utils/player-helpers";
import { FeedbackPanel } from "./feedback-panel";
import {
  PlayerBrandingLink,
  PlayerPrimaryButton,
  PlayerSecondaryButton,
} from "./player-footer-button";
import { getFeedbackTheme } from "./scene-feedback-panel";

export const PLAYER_FOOTER_DOCK_HEIGHT = "6.5rem";

interface PlayerNavigationFooterProps {
  currentScene: PlayerScene;
  allAnswered: boolean;
  isPending: boolean;
  submissionError?: string | null;
  buttonLabel: string;
  onNext: () => void;
  canGoBack: boolean;
  backLabel: string;
  onBack: () => void;
  isAnonymous?: boolean;
  feedbackSummary?: SceneFeedbackSummary | null;
  t: LearningPlayerTranslations;
}

export const CheckDock = ({
  props,
  isEnabled,
  backEnabled,
}: {
  props: PlayerNavigationFooterProps;
  isEnabled: boolean;
  backEnabled: boolean;
}) => {
  const buttonStyle: StyleWithCssVars = {
    ...getScenePrimaryButtonStyle(props.currentScene),
    "--btn-shadow": getScenePrimaryButtonShadowColor(props.currentScene),
  };
  return (
    <motion.div
      key="check-dock"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-hairline pointer-events-auto relative z-20 w-full border-t-2 bg-white/95 backdrop-blur-sm"
    >
      <div className="mx-auto w-full max-w-lg px-4 pt-4 pb-6 @min-[40rem]:px-6">
        <div className="flex items-stretch gap-3">
          {props.canGoBack ? (
            <PlayerSecondaryButton
              label={props.backLabel}
              isEnabled={backEnabled}
              onClick={props.onBack}
              className="min-w-[6.5rem]"
            />
          ) : null}
          <PlayerPrimaryButton
            label={props.buttonLabel}
            isEnabled={isEnabled}
            isLoading={props.isPending}
            onClick={props.onNext}
            className={cn(
              props.canGoBack && "flex-1",
              isEnabled
                ? "shadow-[0_4px_0_0_var(--btn-shadow),inset_0_2px_0_0_rgba(255,255,255,0.22)] hover:brightness-[1.06] active:translate-y-1 active:shadow-[inset_0_2px_0_0_rgba(255,255,255,0.12)]"
                : "bg-ground text-ink-faint cursor-not-allowed shadow-[0_4px_0_0_var(--color-edge)]",
            )}
            style={isEnabled ? buttonStyle : undefined}
          />
        </div>
        {props.submissionError ? (
          <p
            role="alert"
            className="mt-3 rounded-xl border-2 border-[#ffc4c4] bg-[#ffdfdf] px-3 py-2 text-center text-sm font-semibold text-[#c42424]"
          >
            {props.submissionError}
          </p>
        ) : null}
        {props.isAnonymous ? (
          <PlayerBrandingLink className="text-ink-faint hover:text-ink-muted mt-3 block text-center text-[10px] font-semibold tracking-wider uppercase transition-colors" />
        ) : null}
      </div>
    </motion.div>
  );
};

export function PlayerNavigationFooter({
  currentScene,
  allAnswered,
  isPending,
  submissionError = null,
  buttonLabel,
  onNext,
  canGoBack,
  backLabel,
  onBack,
  isAnonymous = false,
  feedbackSummary = null,
  t,
}: PlayerNavigationFooterProps) {
  const isEnabled = allAnswered && !isPending;
  const backEnabled = canGoBack && !isPending;
  const showFeedback = feedbackSummary !== null;
  const theme = showFeedback ? getFeedbackTheme(feedbackSummary.status) : null;
  const footerStyle: StyleWithCssVars = {
    ...getSceneDesignVars(currentScene),
    "--player-footer-dock": PLAYER_FOOTER_DOCK_HEIGHT,
  };

  return (
    <footer
      className="pointer-events-none absolute right-0 bottom-0 left-0 z-30 w-full"
      style={footerStyle}
    >
      <AnimatePresence initial={false} mode="wait">
        {showFeedback ? (
          <FeedbackPanel
            key={currentScene.id}
            feedbackSummary={feedbackSummary}
            theme={theme!}
            isEnabled={isEnabled}
            buttonLabel={buttonLabel}
            onNext={onNext}
            canGoBack={canGoBack}
            backLabel={backLabel}
            onBack={onBack}
            backEnabled={backEnabled}
            isAnonymous={isAnonymous}
            t={t}
          />
        ) : (
          <CheckDock
            props={{
              currentScene,
              allAnswered,
              isPending,
              submissionError,
              buttonLabel,
              onNext,
              canGoBack,
              backLabel,
              onBack,
              isAnonymous,
              feedbackSummary,
              t,
            }}
            isEnabled={isEnabled}
            backEnabled={backEnabled}
          />
        )}
      </AnimatePresence>
    </footer>
  );
}
