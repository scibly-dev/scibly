import type { Locale } from "@scibly/i18n/constants";

import { constructMetadata } from "@scibly/lib";
import { routes } from "@scibly/routes";
import { type Metadata } from "next";
import dynamic from "next/dynamic";

import { FaqJsonLd } from "@/components/faq/faq-json-ld";
import { getFullDictionary } from "@/i18n/dictionaries";
import { buildLocaleAlternates } from "@/lib/metadata";

import { ComparisonSection } from "./components/home-page-section/comparison/comparison";
import { FaqSection } from "./components/home-page-section/faq/faq";
import { FounderSection } from "./components/home-page-section/founder/founder";
import { Hero } from "./components/home-page-section/hero/hero";
import { HeroComplianceStrip } from "./components/home-page-section/hero/hero-compliance-strip";
import { HeroVideo } from "./components/home-page-section/hero/hero-video";
import { KnowledgeSourcesSection } from "./components/home-page-section/knowledge-sources/knowledge-sources-section";
import { OnboardingFlowSection } from "./components/home-page-section/onboarding-flow/onboarding-flow-section";
import { ProblemNumbersSection } from "./components/home-page-section/problem-numbers/problem-numbers-section";

const FeatureShowcase = dynamic(() =>
  import("./components/home-page-section/feature-showcase").then(
    (m) => m.FeatureShowcase,
  ),
);
const ProductPreviewSection = dynamic(() =>
  import("./components/home-page-section/hero/product-preview-section").then(
    (m) => m.ProductPreviewSection,
  ),
);
const DemoTourSection = dynamic(() =>
  import("./components/home-page-section/demo-tour/demo-tour").then(
    (m) => m.DemoTourSection,
  ),
);
const ComplianceSection = dynamic(() =>
  import("./components/home-page-section/compliance/compliance").then(
    (m) => m.ComplianceSection,
  ),
);
const OpenSourceSection = dynamic(() =>
  import("./components/home-page-section/open-source/open-source").then(
    (m) => m.OpenSourceSection,
  ),
);
const CtaSection = dynamic(() =>
  import("./components/home-page-section/cta/cta").then((m) => m.CtaSection),
);

export async function generateMetadata(props: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const dict = await getFullDictionary(lang);
  const { canonicalUrl, languages } = buildLocaleAlternates("/", lang);
  return {
    ...constructMetadata({
      fullTitle: dict.home.metadata.title,
      description: dict.home.metadata.description,
      url: canonicalUrl,
      locale: lang,
    }),
    alternates: { canonical: canonicalUrl, languages },
  };
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Scibly",
  url: routes.web.base.home,
  logo: "https://scibly-assets.s3.eu-central-1.amazonaws.com/logo-32x32.png",
  sameAs: ["https://linkedin.com/company/scibly/"],
};

export default async function Home(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const params = await props.params;
  const dict = await getFullDictionary(params.lang);

  return (
    <main className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <FaqJsonLd questions={dict.faq.questions} />
      <Hero t={dict.hero}>
        <DemoTourSection t={dict.demoTour} locale={params.lang} />
      </Hero>
      <HeroComplianceStrip t={dict.hero} />
      <HeroVideo t={dict.hero} />
      <KnowledgeSourcesSection t={dict.knowledgeSources} />
      <ProblemNumbersSection t={dict.problemNumbers} />
      <OnboardingFlowSection t={dict.onboardingFlow} />
      <FeatureShowcase t={dict.featureShowcase} locale={params.lang} />
      <ProductPreviewSection t={dict.hero} locale={params.lang} />
      <FounderSection t={dict.founder} />
      <ComplianceSection t={dict.compliance} />
      <OpenSourceSection t={dict.openSource} />
      <ComparisonSection t={dict.comparison} />
      <CtaSection t={dict.cta} />
      <FaqSection t={dict.faq} locale={params.lang} />
    </main>
  );
}
