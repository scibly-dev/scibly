"use client";

import { motion } from "framer-motion";

import { GuideCharacterAvatar } from "@/shared/content/editor/blocks/guide-character/components/guide-character-avatar";

import { COURSE_HIGHLIGHT } from "../course-overview/course-path-theme";

interface ExitModalBodyProps {
  title: string;
  description: string;
  stayLabel: string;
  exitLabel: string;
  onStay: () => void;
  onExit: () => void;
  layout: "sheet" | "dialog";
}

export function ExitModalBody({
  title,
  description,
  stayLabel,
  exitLabel,
  onStay,
  onExit,
  layout,
}: ExitModalBodyProps) {
  const isDialog = layout === "dialog";

  return (
    <div
      className={
        isDialog
          ? "px-2 pt-2 pb-1"
          : "px-6 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
      }
    >
      <div
        className={
          isDialog
            ? "mx-auto flex h-44 w-44 items-end justify-center"
            : "mx-auto flex h-40 w-40 items-end justify-center"
        }
      >
        <GuideCharacterAvatar
          reaction="mourning"
          animated
          className={
            isDialog
              ? "h-full w-full max-w-[11rem]"
              : "h-full w-full max-w-[10rem]"
          }
          svgClassName={
            isDialog
              ? "max-h-[10.5rem] max-w-[11rem] w-full"
              : "max-h-[9.5rem] max-w-[10rem] w-full"
          }
        />
      </div>

      <h3 className="mt-3 text-center text-[1.35rem] leading-tight font-extrabold tracking-tight text-neutral-900 md:text-2xl">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-[20rem] text-center text-sm leading-relaxed text-neutral-500 md:max-w-[22rem] md:text-[0.9375rem]">
        {description}
      </p>

      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98, y: 2 }}
        onClick={onStay}
        className="mt-7 w-full rounded-2xl py-4 text-sm font-extrabold tracking-[0.1em] text-white uppercase md:mt-8"
        style={{
          backgroundColor: COURSE_HIGHLIGHT.primary,
          boxShadow: `0 4px 0 0 ${COURSE_HIGHLIGHT.primaryDark}`,
        }}
      >
        {stayLabel}
      </motion.button>

      <button
        type="button"
        onClick={onExit}
        className="mt-3 w-full py-2.5 text-center text-xs font-bold tracking-[0.12em] text-rose-500 uppercase transition-colors hover:text-rose-600"
      >
        {exitLabel}
      </button>
    </div>
  );
}
