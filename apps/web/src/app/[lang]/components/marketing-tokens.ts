import type { CSSProperties } from "react";

export const PILLAR_IDS = [
  "import",
  "channels",
  "learner",
  "analytics",
  "byoai",
] as const;

export type PillarId = (typeof PILLAR_IDS)[number];

export const toPillarId = (id: string): PillarId | undefined =>
  PILLAR_IDS.find((known) => known === id);

export type Pillar = {
  softColor: string;

  lipColor: string;

  accentColor: string;
};

export const PILLARS = {
  import: { softColor: "#b9d7ff", lipColor: "#7ab4ff", accentColor: "#0b4fb0" },
  channels: {
    softColor: "#aeefe1",
    lipColor: "#72dfc8",
    accentColor: "#055e4e",
  },
  learner: {
    softColor: "#d3f7ab",
    lipColor: "#a3e163",
    accentColor: "#376e00",
  },
  analytics: {
    softColor: "#ffd4a8",
    lipColor: "#ffb56b",
    accentColor: "#9a4700",
  },
  byoai: { softColor: "#d5c9ff", lipColor: "#b39dff", accentColor: "#4b2bc4" },
} satisfies Record<PillarId, Pillar>;

export const PRODUCT_INK = "#131c46";

export type KeyTone = {
  face: string;
  edge: string;
  lip: string;
  ink: string;
};

export const IDLE_KEY: KeyTone = {
  face: "#ffffff",
  edge: "#e5e5e5",
  lip: "#e2e2e2",
  ink: "#3b4574",
};

export const CORRECT_KEY: KeyTone = {
  face: "#ddffbe",
  edge: "#58cc02",
  lip: "#4aab02",
  ink: "#2f6a00",
};

export const NOTICE_KEY: KeyTone = {
  face: "#fff8e6",
  edge: "#ffc800",
  lip: "#e0a800",
  ink: "#7d5800",
};

export const DONE_KEY: KeyTone = {
  face: CORRECT_KEY.edge,
  edge: CORRECT_KEY.edge,
  lip: CORRECT_KEY.lip,
  ink: "#ffffff",
};

export function chosenKey({
  softColor,
  lipColor,
  accentColor,
}: Pillar): KeyTone {
  return {
    face: "#ffffff",
    edge: lipColor,
    lip: softColor,
    ink: accentColor,
  };
}

export function panelKey({ softColor, lipColor }: Pillar): KeyTone {
  return {
    face: "#ffffff",
    edge: softColor,
    lip: lipColor,
    ink: PRODUCT_INK,
  };
}

export function lipShadow(color: string, depth = 4): string {
  return `0 ${depth}px 0 0 ${color}`;
}

export function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, #ffffff)`;
}

export function keyShadow(lip: string): string {
  return `${lipShadow(lip, 2)}, 0 4px 10px -6px rgba(15,35,61,0.3), inset 0 1px 0 rgba(255,255,255,0.9)`;
}

export function keyStyle(tone: KeyTone, depth = 4): CSSProperties {
  return {
    backgroundColor: tone.face,
    borderColor: tone.edge,
    color: tone.ink,
    boxShadow: lipShadow(tone.lip, depth),
  };
}

export function washStyle({ softColor, lipColor }: Pillar): CSSProperties {
  return {
    backgroundColor: tint(softColor, 38),
    borderColor: tint(lipColor, 45),
    boxShadow: `${lipShadow(lipColor)}, 0 18px 40px -26px rgba(15,35,61,0.4)`,
  };
}
