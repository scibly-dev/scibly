import { PILLARS } from "@/app/[lang]/components/marketing-tokens";

import {
  accentKey,
  previewRule,
  previewWash,
  selectedKey,
} from "../hero-preview-kit";

export const PILLAR = PILLARS.learner;

export const RULE = previewRule(PILLAR);

export const RAIL = previewWash(PILLAR, 22);

export const ACCENT = accentKey(PILLAR);

export const SELECTED = selectedKey(PILLAR);

export const SCENE_COUNT = 6;
export const ACTIVE_SCENE = 2;

export const PREV_SCENE = ACTIVE_SCENE - 1;
export const NEXT_SCENE = ACTIVE_SCENE + 1;

export const SCENE_PERCENT = Math.round((ACTIVE_SCENE / SCENE_COUNT) * 100);
