import type { KnowledgeTranslations } from "../../contracts";

import { Github } from "lucide-react";

import { type RouterOutputs } from "@/shared/api/trpc/contracts";

export type TopicView = RouterOutputs["knowledge"]["get"];
export type Bundle = TopicView["bundles"][number];
export type Run = TopicView["runs"][number];
export type Insight = TopicView["insights"][number];

export const PROVIDERS = { GITHUB: Github } satisfies Record<
  Bundle["provider"] | Run["provider"],
  typeof Github
>;

/** `FAILED` and `UNFUNDED` are waiting to be sent round again, not finished. */
const UNSETTLED: Bundle["outcome"][] = ["READING", "FAILED", "UNFUNDED"];

export const isSettled = (bundle: Bundle) =>
  !UNSETTLED.includes(bundle.outcome);

export const outcomeLabels = (t: KnowledgeTranslations) =>
  ({
    READING: t.feed.outcomeReading,
    EXTRACTED: t.feed.outcomeExtracted,
    NO_INSIGHTS: t.feed.outcomeNoInsights,
    LOW_VALUE: t.feed.outcomeLowValue,
    OFF_TOPIC: t.feed.outcomeOffTopic,
    UNFUNDED: t.feed.outcomeUnfunded,
    FAILED: t.feed.outcomeFailed,
  }) satisfies Record<Bundle["outcome"], string>;
