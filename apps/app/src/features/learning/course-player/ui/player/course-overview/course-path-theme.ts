import { COURSE_HIGHLIGHT_TOKENS } from "@scibly/ui/product-tokens";

export const COURSE_HIGHLIGHT = {
  ...COURSE_HIGHLIGHT_TOKENS,
  primaryWash: "#eff5ff",
  primaryShadow: "rgba(11, 79, 176, 0.18)",
  primaryGlow: "rgba(0, 102, 255, 0.14)",
  nextFace: "#2b8cff",
  nextLip: "#0b57b4",
  completedLip: "#0d478d",
  pathInk: "#0b4fb0",

  primaryLip: "#0046ad",
  lockedLip: "#d5dfef",
  goalFace: "#ffc800",
  goalEdge: "#b87f02",
  goalGlyph: "#925f04",
} as const;

export const COURSE_PATH_THEME = {
  pathStroke: COURSE_HIGHLIGHT.pathInactive,
} as const;

export const PATH_WIDTH_PX = 300;
export const PATH_STEP_HEIGHT_PX = 56;

export function getPathNodeOffset(index: number): number {
  const pattern = [0, 45, 64, 45, 0, -45, -64, -45];
  return pattern[index % pattern.length]!;
}
