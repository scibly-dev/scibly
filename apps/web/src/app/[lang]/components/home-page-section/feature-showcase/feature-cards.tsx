import type { ReactNode } from "react";

import { type PillarId } from "@/app/[lang]/components/marketing-tokens";

import { AnalyticsDetailStage } from "./analytics-visual";
import { ByoAiDetailStage } from "./byoai-visual";
import { ChannelsDetailStage } from "./channels-visual";
import { type FeatureShowcaseDictionary } from "./i18n/feature-showcase.types";
import { ImportDetailStage } from "./import-visual";
import { LearnerDetailStage } from "./learner-visual";

export type FeatureCardDef = {
  id: PillarId;
  detail: (t: FeatureShowcaseDictionary) => ReactNode;
};

export const FEATURE_CARDS: FeatureCardDef[] = [
  { id: "import", detail: (t) => <ImportDetailStage t={t.import} /> },
  { id: "channels", detail: (t) => <ChannelsDetailStage t={t.channels} /> },
  { id: "learner", detail: (t) => <LearnerDetailStage t={t.learner} /> },
  { id: "analytics", detail: (t) => <AnalyticsDetailStage t={t.analytics} /> },
  { id: "byoai", detail: (t) => <ByoAiDetailStage t={t.byoai} /> },
];
