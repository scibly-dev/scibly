import type { CSSProperties } from "react";

import {
  type KeyTone,
  type Pillar,
  tint,
} from "@/app/[lang]/components/marketing-tokens";

export function previewWash(pillar: Pillar, percent: number): string {
  return tint(pillar.softColor, percent);
}

export function previewRule(pillar: Pillar): string {
  return tint(pillar.lipColor, 26);
}

export function accentKey(pillar: Pillar): KeyTone {
  return {
    face: pillar.accentColor,
    edge: pillar.accentColor,
    lip: "transparent",
    ink: "#ffffff",
  };
}

export function selectedKey(pillar: Pillar): KeyTone {
  return {
    face: previewWash(pillar, 34),
    edge: tint(pillar.lipColor, 42),
    lip: "transparent",
    ink: pillar.accentColor,
  };
}

export function flatKey(tone: KeyTone, depth = 0): CSSProperties {
  const solid = tone.face === tone.edge;
  return {
    backgroundColor: tone.face,
    borderColor: solid ? tone.edge : tint(tone.edge, 62),
    color: tone.ink,
    boxShadow: depth > 0 ? "0 1px 2px rgba(19,28,70,0.05)" : undefined,
  };
}

export function pressableStyle(tone: KeyTone, depth = 3): CSSProperties {
  const solid = tone.face === tone.edge;
  const lip = solid
    ? `color-mix(in srgb, ${tone.face} 68%, #000000)`
    : tone.lip;

  return {
    backgroundColor: tone.face,
    borderColor: solid
      ? tone.edge
      : `color-mix(in srgb, ${tone.edge} 62%, #ffffff)`,
    color: tone.ink,
    boxShadow: [
      `0 ${depth}px 0 0 ${lip}`,
      `0 ${depth * 2}px ${depth * 4}px -${depth * 2}px color-mix(in srgb, ${lip} 55%, transparent)`,
      "inset 0 1px 0 rgba(255,255,255,0.3)",
    ].join(", "),
  };
}

export function previewCardStyle(pillar: Pillar): CSSProperties {
  return {
    backgroundColor: "#ffffff",
    borderColor: previewRule(pillar),
    boxShadow:
      "0 1px 2px rgba(19,28,70,0.04), 0 18px 36px -26px rgba(19,28,70,0.32)",
  };
}

export function previewTrayStyle(pillar: Pillar): CSSProperties {
  return {
    backgroundColor: previewWash(pillar, 26),
    borderColor: previewRule(pillar),
  };
}

export function previewCanvasStyle(pillar: Pillar): CSSProperties {
  return {
    backgroundColor: previewWash(pillar, 16),
    backgroundImage: `radial-gradient(circle, color-mix(in srgb, ${pillar.accentColor} 13%, transparent) 1px, transparent 1.2px)`,
    backgroundSize: "18px 18px",
  };
}

export const PREVIEW_META = "#667085";

export const PREVIEW_PLACEHOLDER = "#8892a8";
