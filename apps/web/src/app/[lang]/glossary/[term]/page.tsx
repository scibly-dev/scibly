import type { Locale } from "@scibly/i18n/constants";
import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { GLOSSARY_TERMS } from "../components/terms";
import {
  getGlossaryTermMetadata,
  RenderGlossaryTerm,
} from "../utils/mdx-page-helper";

export async function generateStaticParams() {
  return GLOSSARY_TERMS.en.flatMap((term) => [
    { lang: "en", term: term.slug },
    { lang: "de", term: term.slug },
  ]);
}

export async function generateMetadata(props: {
  params: Promise<{ lang: Locale; term: string }>;
}): Promise<Metadata> {
  const { lang, term } = await props.params;
  return getGlossaryTermMetadata(term, lang);
}

export default async function GlossaryTermPage(props: {
  params: Promise<{ lang: Locale; term: string }>;
}) {
  const { lang, term } = await props.params;

  const termExists = GLOSSARY_TERMS[lang]?.some((t) => t.slug === term);
  if (!termExists) {
    notFound();
  }

  let dePost;
  let enPost;

  try {
    dePost = (await import(`./${term}/de.mdx`)).default;
    enPost = (await import(`./${term}/en.mdx`)).default;
  } catch (error) {
    console.error(`Failed to load MDX for glossary term: ${term}`, error);
    notFound();
  }

  return (
    <RenderGlossaryTerm
      lang={lang}
      terms={{
        en: enPost,
        de: dePost,
      }}
    />
  );
}
