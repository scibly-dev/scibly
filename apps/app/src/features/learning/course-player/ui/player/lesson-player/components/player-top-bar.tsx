"use client";

import type { LearningPlayerTranslations } from "../../i18n/learning-player.types";
import type { PlayerScene } from "../../utils/player-types";

import { cn } from "@scibly/ui/utils";
import { AnimatePresence, motion } from "framer-motion";
import { MoreHorizontal, X } from "lucide-react";

import { env } from "@/env";

import { getSceneDesignVars } from "../../utils/player-helpers";

interface PlayerTopBarProps {
  currentSceneIndex: number;
  totalScenes: number;
  currentScene: PlayerScene;
  onClose: () => void;

  canExit?: boolean;
  showMenu: boolean;
  onToggleMenu: () => void;
  isAnonymous?: boolean;
  t: LearningPlayerTranslations;
  className?: string;
}

export const AnonymousMenu = ({
  show,
  onToggle,
  label,
}: {
  show: boolean;
  onToggle: () => void;
  label: string;
}) => (
  <div className="relative">
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className="flex h-10 w-10 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
    >
      <MoreHorizontal className="h-5 w-5" />
    </motion.button>
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          className="absolute top-full right-0 z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg"
        >
          <a
            href={env.NEXT_PUBLIC_WEB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <span>{label}</span>
          </a>
        </motion.div>
      ) : null}
    </AnimatePresence>
  </div>
);

export function PlayerTopBar({
  currentSceneIndex,
  totalScenes,
  currentScene,
  onClose,
  canExit = true,
  showMenu,
  onToggleMenu,
  isAnonymous = false,
  t,
  className,
}: PlayerTopBarProps) {
  const progressPct =
    totalScenes > 0 ? ((currentSceneIndex + 1) / totalScenes) * 100 : 0;

  return (
    <div
      className={cn(
        "border-hairline relative z-20 flex shrink-0 flex-col gap-3 border-b-2 bg-white/90 px-4 pt-4 pb-3 backdrop-blur-sm @min-[40rem]:px-6",
        className,
      )}
      style={getSceneDesignVars(currentScene)}
    >
      <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
        {canExit ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            aria-label={t.exitModal?.exit ?? "Exit"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
          >
            <X className="h-6 w-6 stroke-[2.5]" />
          </motion.button>
        ) : (
          <span className="w-10 shrink-0" aria-hidden />
        )}

        <div className="bg-hairline h-4 flex-1 overflow-hidden rounded-full">
          <motion.div
            className="h-full rounded-full shadow-[inset_0_2px_0_0_rgba(255,255,255,0.28)]"
            style={{ backgroundColor: "var(--editor-primary-color)" }}
            initial={false}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <div className="flex w-10 shrink-0 items-center justify-end">
          {isAnonymous ? (
            <AnonymousMenu
              show={showMenu}
              onToggle={onToggleMenu}
              label={t.topBar.createCoursesPrompt}
            />
          ) : (
            <span className="w-10" aria-hidden />
          )}
        </div>
      </div>
    </div>
  );
}
