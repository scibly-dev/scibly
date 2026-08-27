import type { Locale } from "@scibly/i18n/constants";
import type { Metadata } from "next";

import { constructMetadata } from "@scibly/lib";

import { getFullDictionary } from "@/i18n/dictionaries";
import { buildLocaleAlternates } from "@/lib/metadata";

import { OnboardingOffboardingView } from "./onboarding-offboarding-view";

export async function generateMetadata(props: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const dict = await getFullDictionary(lang);
  const content = dict.onboardingOffboarding;
  const { canonicalUrl, languages } = buildLocaleAlternates(
    "/onboarding-offboarding",
    lang,
  );

  return {
    ...constructMetadata({
      fullTitle: content.meta.title,
      description: content.meta.description,
      url: canonicalUrl,
      keywords: content.meta.keywords,
      locale: lang,
    }),
    alternates: { canonical: canonicalUrl, languages },
  };
}

export default async function OnboardingOffboardingPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await props.params;
  return <OnboardingOffboardingView lang={lang} />;
}
