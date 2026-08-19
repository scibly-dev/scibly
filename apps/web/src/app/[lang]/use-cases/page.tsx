import type { Locale } from "@scibly/i18n/constants";
import type { Metadata } from "next";

import { appendLocalePrefix } from "@scibly/i18n";
import { constructMetadata } from "@scibly/lib";
import { routes } from "@scibly/routes";
import {
  eyebrowClass,
  pageTitleClass,
  subtitleClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";

import { getFullDictionary } from "@/i18n/dictionaries";

import { CtaSection } from "../components/home-page-section/cta/cta";
import { MarketingSection } from "../components/marketing-section-content";
import { UseCasesTabs } from "./components/use-cases-tabs";
import { OVERVIEW_CONTENT } from "./overview-data";

export async function generateMetadata(props: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const content = OVERVIEW_CONTENT[lang];
  const base = routes.web.base.home.replace(/\/$/, "");
  const canonicalUrl = `${base}${appendLocalePrefix(lang, "/use-cases")}`;

  return {
    ...constructMetadata({
      fullTitle: content.meta.title,
      description: content.meta.description,
      url: canonicalUrl,
      keywords: content.meta.keywords,
      locale: lang,
    }),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        de: `${base}${appendLocalePrefix("de", "/use-cases")}`,
        en: `${base}${appendLocalePrefix("en", "/use-cases")}`,
      },
    },
  };
}

export default async function UseCasesOverviewPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await props.params;
  const content = OVERVIEW_CONTENT[lang];
  const dict = await getFullDictionary(lang);

  return (
    <main className="flex flex-col bg-white">
      <MarketingSection top="page" frameClassName="pb-0">
        <div className="mx-auto flex max-w-[800px] flex-col items-center text-center">
          <p className={eyebrowClass}>{content.hero.eyebrow}</p>
          <h1 className={cn(pageTitleClass, "mt-4")}>
            {content.hero.headline}
          </h1>
          <p className={cn(subtitleClass, "mt-5 max-w-[540px]")}>
            {content.hero.subheadline}
          </p>
        </div>
      </MarketingSection>

      <UseCasesTabs
        locale={lang}
        tabs={content.tabs}
        slugLabel={content.slugLabel}
        frequencyLabels={content.frequencyLabels}
      />

      <CtaSection t={dict.cta} />
    </main>
  );
}
