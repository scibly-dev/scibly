import type { CSSProperties } from "react";

import { IDLE_KEY, PILLARS } from "@/app/[lang]/components/marketing-tokens";

import {
  accentKey,
  flatKey,
  PREVIEW_META,
  previewRule,
  previewWash,
  selectedKey,
} from "../hero-preview-kit";

export const PILLAR = PILLARS.byoai;

export const RULE = previewRule(PILLAR);

export const RAIL = previewWash(PILLAR, 22);

export const ACCENT = accentKey(PILLAR);

export const SELECTED = selectedKey(PILLAR);

const SHOW_FROM = {
  md: "hidden md:flex",
  lg: "hidden lg:flex",
  xl: "hidden xl:flex",
} as const;

export type Breakpoint = keyof typeof SHOW_FROM;

export function showFromClass(breakpoint: Breakpoint | undefined): string {
  return breakpoint ? SHOW_FROM[breakpoint] : "flex";
}

export function rowMarkerStyle(active?: boolean): CSSProperties {
  return active
    ? flatKey(ACCENT)
    : {
        backgroundColor: "#ffffff",
        borderColor: IDLE_KEY.edge,
        color: PREVIEW_META,
      };
}
