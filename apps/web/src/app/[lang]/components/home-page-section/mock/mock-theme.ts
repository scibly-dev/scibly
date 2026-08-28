import { type CSSProperties } from "react";

import { BENTO_EASE } from "@/app/[lang]/components/home-page-section/keyframes";
import { type Pillar, tint } from "@/app/[lang]/components/marketing-tokens";

export const MUTED = "#3b4574";
export const FAINT = "#8b93b8";
export const HAIRLINE = "#e6e9f4";

export const enter = (name: string, delayMs: number): CSSProperties => ({
  animation: `${name} 700ms ${BENTO_EASE} ${delayMs}ms both`,
});

export const dottedGround = (tone: Pillar): CSSProperties => ({
  backgroundImage: `radial-gradient(${tint(tone.lipColor, 55)} 1px, transparent 1.2px)`,
  backgroundSize: "14px 14px",
});
