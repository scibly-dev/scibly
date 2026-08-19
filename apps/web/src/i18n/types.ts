import { type ComparisonDictionary } from "@/app/[lang]/components/home-page-section/comparison/i18n/comparison.types";
import { type ComplianceDictionary } from "@/app/[lang]/components/home-page-section/compliance/i18n/compliance.types";
import { type CtaDictionary } from "@/app/[lang]/components/home-page-section/cta/i18n/cta.types";
import { type DemoTourDictionary } from "@/app/[lang]/components/home-page-section/demo-tour/i18n/demo-tour.types";
import { type FaqDictionary } from "@/app/[lang]/components/home-page-section/faq/i18n/faq.types";
import { type FeatureShowcaseDictionary } from "@/app/[lang]/components/home-page-section/feature-showcase/i18n/feature-showcase.types";
import { type FounderDictionary } from "@/app/[lang]/components/home-page-section/founder/i18n/founder.types";
import { type HeroDictionary } from "@/app/[lang]/components/home-page-section/hero/i18n/hero.types";
import { type OpenSourceDictionary } from "@/app/[lang]/components/home-page-section/open-source/i18n/open-source.types";
import { type QualityProofDictionary } from "@/app/[lang]/components/home-page-section/quality-proof/i18n/quality-proof.types";
import { type AppRoutesPage } from "@/app/[lang]/i18n/app-routes.types";
import { type BlogPage } from "@/app/[lang]/i18n/blog.types";
import { type HomePage } from "@/app/[lang]/i18n/home.types";
import { type LegalPage } from "@/app/[lang]/i18n/legal.types";

export type Dictionary = {
  page: {
    home: HomePage;
    blog: BlogPage;
    appRoutes: AppRoutesPage;
    legal: LegalPage;
    cta: CtaDictionary;
    hero: HeroDictionary;
    faq: FaqDictionary;
    qualityProof: QualityProofDictionary;
    comparison: ComparisonDictionary;
    featureShowcase: FeatureShowcaseDictionary;
    compliance: ComplianceDictionary;
    demoTour: DemoTourDictionary;
    founder: FounderDictionary;
    openSource: OpenSourceDictionary;
  };
};

export type Pages = keyof Dictionary["page"];

export type DictionaryPages = Dictionary["page"];
