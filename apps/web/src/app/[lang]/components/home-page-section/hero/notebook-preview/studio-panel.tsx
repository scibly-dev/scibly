"use client";

import { motion } from "framer-motion";

import { flatKey, PREVIEW_META, previewWash } from "../hero-preview-kit";
import { type NotebookCopy } from "./notebook-copy";
import { EASE, PILLAR, RULE, SELECTED } from "./notebook-theme";

export function StudioPanel({
  t,
  progress,
  sceneCount,
}: {
  t: NotebookCopy;
  progress: number;
  sceneCount: number;
}) {
  const scenes = [t.studioSceneOne, t.studioSceneTwo, t.studioSceneThree];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-2.5 py-3">
      <div className="flex items-center justify-between gap-2 px-0.5">
        <p
          className="m-0 text-[10.5px] font-semibold"
          style={{ color: PREVIEW_META }}
        >
          {t.studioBuilding}
        </p>
        <span
          className="text-[10.5px] font-bold tabular-nums"
          style={{ color: PILLAR.accentColor }}
        >
          {progress}%
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full"
        style={{ backgroundColor: previewWash(PILLAR, 70) }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: PILLAR.accentColor }}
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.55, ease: EASE }}
        />
      </div>
      <div className="flex flex-col gap-1.5 pt-0.5">
        {scenes.slice(0, sceneCount).map((scene, index) => (
          <motion.div
            key={scene}
            className="flex items-start gap-1.5 rounded-[10px] border px-2 py-1.5"
            style={flatKey(SELECTED, 2)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <span
              className="mt-px flex size-4 shrink-0 items-center justify-center rounded-[5px] text-[9px] font-bold text-white"
              style={{ backgroundColor: PILLAR.accentColor }}
            >
              {index + 1}
            </span>
            <p className="m-0 text-left text-[10.5px] leading-snug font-bold">
              {scene}
            </p>
          </motion.div>
        ))}
        {sceneCount < scenes.length ? (
          <div
            className="flex items-center gap-1.5 rounded-[10px] border border-dashed px-2 py-2 text-[10px] font-semibold"
            style={{ borderColor: RULE, color: PREVIEW_META }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: PILLAR.lipColor }}
            />
            …
          </div>
        ) : null}
      </div>
    </div>
  );
}
