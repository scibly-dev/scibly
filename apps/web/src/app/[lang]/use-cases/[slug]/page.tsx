import type { Locale } from "@scibly/i18n/constants";
import type { Metadata } from "next";

import { appendLocalePrefix } from "@scibly/i18n";
import { constructMetadata } from "@scibly/lib";
import { routes } from "@scibly/routes";
import { notFound } from "next/navigation";

import { getFullDictionary } from "@/i18n/dictionaries";

import { CtaSection } from "../../components/home-page-section/cta/cta";
import { UseCaseFaq } from "../components/use-case-faq";
import { UseCaseFeatures } from "../components/use-case-features";
import { UseCaseHero } from "../components/use-case-hero";
import { UseCasePain } from "../components/use-case-pain";
import { getUseCaseBySlug, getUseCaseCanonicalKey, USE_CASES } from "../data";

export function generateStaticParams() {
  const params: { lang: Locale; slug: string }[] = [];
  for (const useCase of USE_CASES) {
    params.push({ lang: "de", slug: useCase.slugDe });
    params.push({ lang: "en", slug: useCase.slugEn });
  }
  return params;
}

export async function generateMetadata(props: {
  params: Promise<{ lang: Locale; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await props.params;
  const useCase = getUseCaseBySlug(slug);
  if (!useCase) return {};

  const content = useCase[lang];
  const base = routes.web.base.home.replace(/\/$/, "");
  const canonicalUrl = `${base}${appendLocalePrefix(lang, `/use-cases/${slug}`)}`;
  const languages = {
    de: `${base}${appendLocalePrefix("de", `/use-cases/${useCase.slugDe}`)}`,
    en: `${base}${appendLocalePrefix("en", `/use-cases/${useCase.slugEn}`)}`,
  };

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

export default async function UseCasePage(props: {
  params: Promise<{ lang: Locale; slug: string }>;
}) {
  const { lang, slug } = await props.params;
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    notFound();
  }

  const content = useCase[lang];
  const dict = await getFullDictionary(lang);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faq.questions.map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.a,
      },
    })),
  };

  return (
    <main className="flex flex-col bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <UseCaseHero
        eyebrow={content.hero.eyebrow}
        headline={content.hero.headline}
        subheadline={content.hero.subheadline}
        ctaLabel={content.hero.ctaLabel}
      />
      <UseCasePain
        eyebrow={content.pain.eyebrow}
        title={content.pain.title}
        items={content.pain.items}
      />
      <UseCaseFeatures
        eyebrow={content.solution.eyebrow}
        title={content.solution.title}
        items={content.solution.items}
      />
      <UseCaseFaq
        title={content.faq.title}
        questions={content.faq.questions}
        useCaseKey={getUseCaseCanonicalKey(useCase)}
        locale={lang}
      />
      <CtaSection t={dict.cta} />
    </main>
  );
}
