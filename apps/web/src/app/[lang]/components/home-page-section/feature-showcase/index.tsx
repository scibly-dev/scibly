"use client";

import type { Locale } from "@scibly/i18n/constants";

import { autocaptureAttributes } from "@scibly/observability/autocapture";
import { cn } from "@scibly/ui/utils";
import { useState } from "react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/app/[lang]/components/marketing-section-content";
import {
  type PillarId,
  PILLARS,
} from "@/app/[lang]/components/marketing-tokens";
import { useInViewOnce } from "@/components/in-view-reveal";

import { AnalyticsVisual } from "./analytics-visual";
import { ByoAiVisual } from "./byoai-visual";
import { ChannelsVisual } from "./channels-visual";
import { FeatureAtmosphere } from "./feature-atmosphere";
import { FeatureDetailSheet } from "./feature-detail-sheet";
import { type FeatureShowcaseDictionary } from "./i18n/feature-showcase.types";
import { ImportVisual } from "./import-visual";
import { LearnerVisual } from "./learner-visual";
import { LearningPath, type LearningPathItem } from "./learning-path";

interface FeatureShowcaseProps {
  t: FeatureShowcaseDictionary;
  locale: Locale;
}

export function FeatureShowcase({ t, locale }: FeatureShowcaseProps) {
  const { ref: sectionRef, inView: hasSeen } = useInViewOnce<HTMLElement>(0.12);
  const [activeFeature, setActiveFeature] = useState<PillarId | null>(null);

  const chapter = (id: PillarId, visual: React.ReactNode) => ({
    id,
    phase: t[id].phase,
    title: t[id].title,
    journeyLabel: t[id].stageLabel,
    visual,
    pillar: PILLARS[id],
    onExpand: () => setActiveFeature(id),
    expandCapture: autocaptureAttributes({
      cta: "feature_expand",
      feature_id: id,
      locale,
      placement: "homepage_feature_showcase",
    }),
  });

  const journeyItems: LearningPathItem[] = [
    chapter("import", <ImportVisual t={t.import} />),
    chapter("channels", <ChannelsVisual t={t.channels} />),
    chapter("learner", <LearnerVisual t={t.learner} />),
    chapter("analytics", <AnalyticsVisual t={t.analytics} />),
    chapter("byoai", <ByoAiVisual t={t.byoai} />),
  ];

  return (
    <MarketingSection
      ref={sectionRef}
      id="platform"
      aria-labelledby="feature-showcase-heading"
      className={cn("sc-bento overflow-clip", hasSeen && "sc-bento-ready")}
      frameClassName="pb-0"
      atmosphere={<FeatureAtmosphere />}
    >
      <MarketingSectionHeader
        titleId="feature-showcase-heading"
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.subtitle}
        layout="stacked"
        className="mb-[clamp(40px,6vh,64px)]"
      />

      <LearningPath
        items={journeyItems}
        journeyLabel={t.journeyLabel}
        expandLabel={t.expandAriaLabel}
      />

      <FeatureDetailSheet
        featureId={activeFeature}
        t={t}
        locale={locale}
        onOpenChange={(next) => {
          if (!next) setActiveFeature(null);
        }}
      />
    </MarketingSection>
  );
}
