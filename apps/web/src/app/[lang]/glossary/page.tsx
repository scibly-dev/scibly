import type { Locale } from "@scibly/i18n/constants";
import type { Metadata } from "next";

import { constructMetadata } from "@scibly/lib";
import { routes } from "@scibly/routes";
import {
  cardClass,
  cardInteractiveClass,
  eyebrowClass,
  pageTitleClass,
  subtitleClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import Link from "next/link";

import { buildLocaleAlternates } from "@/lib/metadata";

import { MarketingSection } from "../components/marketing-section-content";
import { GLOSSARY_TERMS } from "./components/terms";

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "de" }];
}

export async function generateMetadata(props: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const { canonicalUrl, languages } = buildLocaleAlternates("/glossary", lang);

  const title =
    lang === "de"
      ? "L&D Glossar – Fachbegriffe für Personalentwicklung & E-Learning"
      : "L&D Glossary – Key Terms for Learning & Development";
  const description =
    lang === "de"
      ? "Definitionen der wichtigsten Fachbegriffe aus Instructional Design, E-Learning, LMS und Lernwissenschaft – klar und kompakt erklärt."
      : "Definitions of key terms in instructional design, e-learning, LMS, and learning science — clear, concise, and practitioner-focused.";

  return {
    ...constructMetadata({
      fullTitle: title,
      description,
      url: canonicalUrl,
      locale: lang,
    }),
    alternates: { canonical: canonicalUrl, languages },
  };
}

export default async function GlossaryIndexPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await props.params;
  const terms = GLOSSARY_TERMS[lang] ?? [];

  const sorted = [...terms].sort((a, b) => a.title.localeCompare(b.title));

  const grouped = sorted.reduce<Record<string, typeof sorted>>((acc, term) => {
    const first = term.title[0]!.toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : "#";
    if (!acc[letter]) acc[letter] = [];
    acc[letter]!.push(term);
    return acc;
  }, {});

  const letters = Object.keys(grouped).sort((a, b) => {
    if (a === "#") return 1;
    if (b === "#") return -1;
    return a.localeCompare(b);
  });

  const heading = lang === "de" ? "L&D Glossar" : "L&D Glossary";
  const subheading =
    lang === "de"
      ? "Fachbegriffe aus Instructional Design, E-Learning, LMS und Lernwissenschaft – kompakt erklärt."
      : "Key terms in instructional design, e-learning, LMS, and learning science — defined for practitioners.";

  return (
    <main className="flex min-h-dvh flex-col bg-white">
      <MarketingSection top="page" frameClassName="max-w-[840px]">
        <header className="mb-14 flex flex-col items-center text-center">
          <p className={eyebrowClass}>
            {lang === "de" ? "Glossar" : "Glossary"}
          </p>
          <h1 className={cn(pageTitleClass, "mt-4")}>{heading}</h1>
          <p className={cn(subtitleClass, "mt-5 max-w-[560px]")}>
            {subheading}
          </p>
        </header>

        <div className="flex flex-col gap-9">
          {letters.map((letter) => (
            <section key={letter}>
              <h2 className="text-link m-0 mb-3 flex size-9 items-center justify-center rounded-[11px] bg-[#eef3ff] text-[14px] font-bold shadow-[0_2px_0_0_#dbe6ff]">
                {letter}
              </h2>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {grouped[letter]!.map((term) => (
                  <li key={term.slug} className="p-0">
                    <Link
                      href={routes.web.glossary.detail(term.slug)}
                      className={cn(
                        cardClass,
                        cardInteractiveClass,
                        "flex flex-col gap-1 px-4 py-3.5 no-underline",
                      )}
                    >
                      <span className="text-ink text-[15.5px] font-semibold tracking-[-0.012em]">
                        {term.title}
                      </span>
                      <span className="text-ink-soft line-clamp-2 text-[13.5px] leading-[1.6]">
                        {term.definition}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </MarketingSection>
    </main>
  );
}
