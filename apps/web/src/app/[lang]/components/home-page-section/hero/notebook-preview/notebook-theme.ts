import { PILLARS } from "@/app/[lang]/components/marketing-tokens";

import {
  accentKey,
  previewRule,
  previewWash,
  selectedKey,
} from "../hero-preview-kit";

export const PILLAR = PILLARS.import;

export const RULE = previewRule(PILLAR);

export const RAIL = previewWash(PILLAR, 22);

export const ACCENT = accentKey(PILLAR);

export const SELECTED = selectedKey(PILLAR);

export const EASE = [0.22, 1, 0.36, 1] as const;

export const CURSOR_MOVE_SECONDS = 1.35;
