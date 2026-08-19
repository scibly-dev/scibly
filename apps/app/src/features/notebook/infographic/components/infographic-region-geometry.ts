import type { CSSProperties } from "react";

import { parseAspectRatio } from "../parse-aspect-ratio";

type ShortSide = "width" | "height";

export function resolveShortSide({
  width,
  height,
  aspectRatio,
}: {
  width?: number;
  height?: number;
  aspectRatio?: string;
}): ShortSide {
  let w = width;
  let h = height;
  if ((!w || !h) && aspectRatio) {
    const parsed = parseAspectRatio(aspectRatio);
    if (parsed) {
      w = parsed.w;
      h = parsed.h;
    }
  }
  if (w && h && w > 0 && h > 0) {
    return w >= h ? "height" : "width";
  }
  return "height";
}

export function regionCircleStyle(
  x: number,
  y: number,
  radius: number,
  shortSide: ShortSide,
): CSSProperties {
  const size = `${Math.max(radius * 2, 1)}%`;
  return {
    left: `${x}%`,
    top: `${y}%`,
    aspectRatio: "1",
    transform: "translate(-50%, -50%)",
    ...(shortSide === "height" ? { height: size } : { width: size }),
  };
}

const POPOVER_WIDTH = 320;
const POPOVER_GAP = 12;
const MARKER_HALF = 10;
const FRAME_INSET = 12;

export function computePopoverLeft(xPercent: number, frameWidth: number) {
  const width = Math.min(
    POPOVER_WIDTH,
    Math.max(140, frameWidth - FRAME_INSET * 2),
  );
  if (frameWidth <= 0) {
    return { left: MARKER_HALF + POPOVER_GAP, width };
  }

  const markerPx = (xPercent / 100) * frameWidth;
  let left = markerPx + MARKER_HALF + POPOVER_GAP;
  if (left + width > frameWidth - FRAME_INSET) {
    left = markerPx - MARKER_HALF - POPOVER_GAP - width;
  }

  const maxLeft = Math.max(FRAME_INSET, frameWidth - width - FRAME_INSET);
  return { left: Math.min(Math.max(left, FRAME_INSET), maxLeft), width };
}

export const MIN_REGION_RADIUS = 4;
export const MAX_REGION_RADIUS = 45;
export const CLICK_RADIUS_THRESHOLD = 3;
