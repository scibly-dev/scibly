"use client";

import { type ReactNode, type Ref } from "react";

import { BENTO_EASE } from "../keyframes";

export const PREVIEW_STAGE_HEIGHT = "h-[420px] md:h-[520px] lg:h-[580px]";

export function HeroPreviewStage({
  children,
  riseDelay = "80ms",
  rootRef,
  frameRef,
  frameClassName = "flex flex-col",
}: {
  children: ReactNode;
  riseDelay?: string;
  rootRef?: Ref<HTMLDivElement>;
  frameRef?: Ref<HTMLDivElement>;
  frameClassName?: "flex" | "flex flex-col";
}) {
  return (
    <div
      ref={rootRef}
      className={`relative overflow-hidden bg-white text-left ${PREVIEW_STAGE_HEIGHT}`}
    >
      <div
        ref={frameRef}
        className={`relative h-full min-h-0 overflow-hidden ${frameClassName}`}
        style={{ animation: `sc-rise 780ms ${BENTO_EASE} ${riseDelay} both` }}
      >
        {children}
      </div>
    </div>
  );
}
