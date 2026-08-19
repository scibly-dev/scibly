"use client";

import type { LearningPlayerTranslations } from "../../i18n/learning-player.types";
import type { SceneFeedbackSummary } from "../utils/scene-feedback-summary";

import { cn } from "@scibly/ui/utils";
import { motion } from "framer-motion";

import {
  PlayerBrandingLink,
  PlayerPrimaryButton,
  PlayerSecondaryButton,
} from "./player-footer-button";
import {
  type getFeedbackTheme,
  SceneFeedbackContent,
} from "./scene-feedback-panel";

interface FeedbackPanelProps {
  feedbackSummary: SceneFeedbackSummary;
  theme: NonNullable<ReturnType<typeof getFeedbackTheme>>;
  isEnabled: boolean;
  buttonLabel: string;
  onNext: () => void;
  canGoBack: boolean;
  backLabel: string;
  onBack: () => void;
  backEnabled: boolean;
  isAnonymous: boolean;
  t: LearningPlayerTranslations;
}

export function FeedbackPanel({
  feedbackSummary,
  theme,
  isEnabled,
  buttonLabel,
  onNext,
  canGoBack,
  backLabel,
  onBack,
  backEnabled,
  isAnonymous,
  t,
}: FeedbackPanelProps) {
  return (
    <motion.div
      key="feedback-panel"
      initial={{ y: 32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 32, opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "pointer-events-auto absolute right-0 bottom-0 left-0 z-10",
        "flex flex-col overflow-hidden",
        "rounded-t-[1.75rem] @min-[40rem]:rounded-t-[2rem]",
        "shadow-[0_-10px_36px_rgba(0,0,0,0.07)]",
        theme.shell,
      )}
    >
      <div className="mx-auto w-full max-w-lg px-4 pt-4 @min-[40rem]:px-6 @min-[40rem]:pt-5">
        <SceneFeedbackContent summary={feedbackSummary} t={t.feedback} />
      </div>

      <div className="mx-auto w-full max-w-lg shrink-0 px-4 pt-4 pb-6 @min-[40rem]:px-6">
        <div className="flex items-stretch gap-3">
          {canGoBack ? (
            <PlayerSecondaryButton
              label={backLabel}
              isEnabled={backEnabled}
              onClick={onBack}
              className="min-w-[6.5rem]"
            />
          ) : null}
          <PlayerPrimaryButton
            label={buttonLabel}
            isEnabled={isEnabled}
            onClick={onNext}
            className={
              canGoBack
                ? cn(
                    "flex-1 active:translate-y-1 active:shadow-none",
                    isEnabled ? theme.button : theme.buttonDisabled,
                  )
                : isEnabled
                  ? cn("active:translate-y-1 active:shadow-none", theme.button)
                  : cn("cursor-not-allowed", theme.buttonDisabled)
            }
          />
        </div>

        {isAnonymous ? (
          <PlayerBrandingLink className="mt-3 block text-center text-[10px] font-semibold tracking-wider text-black/35 uppercase transition-colors hover:text-black/50" />
        ) : null}
      </div>
    </motion.div>
  );
}
