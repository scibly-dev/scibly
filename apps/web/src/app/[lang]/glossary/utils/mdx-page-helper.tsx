import type { Locale } from "@scibly/i18n/constants";
import type { Metadata } from "next";

import { constructMetadata } from "@scibly/lib";
import { notFound } from "next/navigation";
import { type ComponentType, createElement } from "react";

import { GLOSSARY_TERMS } from "@/app/[lang]/glossary/components/terms";
import { buildLocaleAlternates } from "@/lib/metadata";
import { useMDXComponents } from "@/mdx-components";

export function getGlossaryTermMetadata(slug: string, lang: Locale): Metadata {
  const term = GLOSSARY_TERMS[lang]?.find((t) => t.slug === slug);
  if (!term) return {};

  const { canonicalUrl, languages } = buildLocaleAlternates(
    `/glossary/${slug}`,
    lang,
  );

  return {
    ...constructMetadata({
      fullTitle: `${term.title} | Scibly Glossary`,
      description: term.definition,
      url: canonicalUrl,
      keywords: term.keywords,
      locale: lang,
    }),
    alternates: { canonical: canonicalUrl, languages },
  };
}

interface RenderGlossaryTermProps {
  lang: Locale;
  terms: {
    en: ComponentType<any>;
    de: ComponentType<any>;
  };
}

export function RenderGlossaryTerm({ lang, terms }: RenderGlossaryTermProps) {
  const mdxComponents = useMDXComponents({});

  if (lang === "en") {
    return createElement(terms.en, { components: mdxComponents });
  }
  if (lang === "de") {
    return createElement(terms.de, { components: mdxComponents });
  }

  notFound();
}
