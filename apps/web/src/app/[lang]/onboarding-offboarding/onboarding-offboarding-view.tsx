import type { Locale } from "@scibly/i18n/constants";

import dynamic from "next/dynamic";

import { FaqJsonLd } from "@/components/faq/faq-json-ld";
import { getFullDictionary } from "@/i18n/dictionaries";

import { ComparisonSection } from "../components/home-page-section/comparison/comparison";
import { CtaSection } from "../components/home-page-section/cta/cta";
import { HeroComplianceStrip } from "../components/home-page-section/hero/hero-compliance-strip";
import { UseCaseFaq } from "../use-cases/components/use-case-faq";
import { UseCaseHero } from "../use-cases/components/use-case-hero";
import { KnowledgeSourcesSection } from "./components/knowledge-sources/knowledge-sources-section";
import { OnboardingFlowSection } from "./components/onboarding-flow/onboarding-flow-section";
import { ProblemNumbersSection } from "./components/problem-numbers/problem-numbers-section";

const FeatureShowcase = dynamic(() =>
  import("../components/home-page-section/feature-showcase").then(
    (m) => m.FeatureShowcase,
  ),
);
const OpenSourceSection = dynamic(() =>
  import("../components/home-page-section/open-source/open-source").then(
    (m) => m.OpenSourceSection,
  ),
);
const ComplianceSection = dynamic(() =>
  import("../components/home-page-section/compliance/compliance").then(
    (m) => m.ComplianceSection,
  ),
);

export async function OnboardingOffboardingView({ lang }: { lang: Locale }) {
  const dict = await getFullDictionary(lang);
  const content = dict.onboardingOffboarding;

  return (
    <main className="flex flex-col bg-white">
      <FaqJsonLd questions={content.faq.questions} />
      <UseCaseHero
        headline={content.hero.headline}
        subheadline={content.hero.subheadline}
        ctaLabel={content.hero.ctaLabel}
        imageAlt={dict.hero.productAlt}
        openSource={dict.hero.openSource}
      />
      <HeroComplianceStrip t={dict.hero} />
      <KnowledgeSourcesSection t={content.knowledgeSources} />
      <ProblemNumbersSection t={content.problemNumbers} />
      <OnboardingFlowSection t={content.onboardingFlow} />
      <OpenSourceSection t={dict.openSource} />
      <FeatureShowcase
        t={{ ...dict.featureShowcase, ...content.featureShowcaseHeader }}
        locale={lang}
      />
      <ComparisonSection
        t={{
          ...dict.comparison,
          table: {
            ...dict.comparison.table,
            rows: [...content.comparisonRows, ...dict.comparison.table.rows],
          },
        }}
      />
      <ComplianceSection t={dict.compliance} />
      <CtaSection
        t={content.cta}
        calendlyUrl="https://calendly.com/niclas-gregor20/30min"
      />
      <UseCaseFaq
        title={content.faq.title}
        questions={content.faq.questions}
        useCaseKey="onboarding-offboarding"
        locale={lang}
        context="landing-page"
      />
    </main>
  );
}
