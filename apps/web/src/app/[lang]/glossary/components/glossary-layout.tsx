import type { Locale } from "@scibly/i18n/constants";

import { routes } from "@scibly/routes";
import Icon from "@scibly/ui/components/icon";
import {
  actionClass,
  cardClass,
  chipClass,
  chipRestClass,
  eyebrowClass,
  primaryActionClass,
  subtitleClass,
  titleClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import Link from "next/link";

import { getFullDictionary } from "@/i18n/dictionaries";

import { BLOG_POSTS } from "../../blog/components/posts";
import { ScrollProgressBar } from "../../blog/components/scroll-progress-bar";
import { TableOfContents } from "../../blog/components/table-of-contents";
import { MarketingGridField } from "../../components/marketing-grid-field";
import { marketingPageSectionStickyClass } from "../../components/marketing-section-content";
import { MarketingSectionFrame } from "../../components/marketing-section-frame";
import { GLOSSARY_TERMS } from "./terms";

interface GlossaryLayoutProps {
  children: React.ReactNode;
  metadata: {
    title: string;
    definition: string;
    keywords?: string[];
    relatedTerms?: string[];
    relatedPost?: string;
  };
  lang: Locale;
}

export async function GlossaryLayout({
  children,
  metadata,
  lang,
}: GlossaryLayoutProps) {
  const dict = await getFullDictionary(lang);
  const tBlog = dict.blog;

  const terms = GLOSSARY_TERMS[lang] || [];

  const relatedTermEntries = (metadata.relatedTerms ?? [])
    .map((slug) => terms.find((t) => t.slug === slug))
    .filter((t) => t !== undefined);

  const relatedBlogPost = metadata.relatedPost
    ? (BLOG_POSTS[lang]?.find((p) => p.slug === metadata.relatedPost) ?? null)
    : null;

  const backLabel = lang === "de" ? "Zurück zum Glossar" : "Back to Glossary";
  const relatedTermsLabel =
    lang === "de" ? "Verwandte Begriffe" : "Related terms";
  const deeperLabel = lang === "de" ? "Tiefer einsteigen" : "Go deeper";

  return (
    <>
      <ScrollProgressBar />

      <main className={cn(marketingPageSectionStickyClass, "min-h-dvh")}>
        <MarketingGridField />

        <MarketingSectionFrame className="relative z-10 grid grid-cols-1 gap-14 px-5 pt-[clamp(104px,15vh,152px)] pb-[clamp(64px,10vh,130px)] md:px-[clamp(20px,5vw,40px)] lg:grid-cols-[1fr_260px]">
          <article className="min-w-0">
            {/* Back button */}
            <div className="mb-9">
              <Link
                href={routes.web.glossary.root}
                className="group text-ink-soft hover:text-ink inline-flex items-center gap-2 text-[14px] font-semibold no-underline transition-colors duration-200"
              >
                <Icon
                  name="ArrowLeft"
                  className="h-4 w-4 transform transition-transform duration-200 group-hover:-translate-x-0.5"
                />
                {backLabel}
              </Link>
            </div>

            {/* Header */}
            <header className="mb-9">
              <p className={eyebrowClass}>
                {lang === "de" ? "Glossar" : "Glossary"}
              </p>
              <h1
                className={cn(titleClass, "mt-4 text-[clamp(30px,3.2vw,44px)]")}
              >
                {metadata.title}
              </h1>
              <p
                className={cn(
                  subtitleClass,
                  "border-ground mt-5 border-b-2 pb-8 text-[18px]",
                )}
              >
                {metadata.definition}
              </p>
            </header>

            {/* Content */}
            <section className="font-sans">{children}</section>

            {/* Related terms */}
            {relatedTermEntries.length > 0 && (
              <div className="border-ground mt-12 border-t-2 pt-8">
                <p className={cn(eyebrowClass, "mb-4")}>{relatedTermsLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {relatedTermEntries.map((term) => (
                    <Link
                      key={term.slug}
                      href={routes.web.glossary.detail(term.slug)}
                      className={cn(chipClass, chipRestClass, "no-underline")}
                    >
                      {term.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related blog post */}
            {metadata.relatedPost && relatedBlogPost && (
              <div className="border-ground mt-8 border-t-2 pt-8">
                <p className={cn(eyebrowClass, "mb-3")}>{deeperLabel}</p>
                <Link
                  href={routes.web.blog.detail(metadata.relatedPost)}
                  className="group text-link inline-flex items-center gap-2 text-[14.5px] font-semibold no-underline transition-colors hover:text-[#0066FF]"
                >
                  {relatedBlogPost.title}
                  <Icon
                    name="ArrowRight"
                    className="h-4 w-4 transform transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </div>
            )}

            {/* Scibly CTA */}
            <div className={cn(cardClass, "mt-12 p-7")}>
              <p className="text-ink m-0 text-[16.5px] font-semibold tracking-[-0.016em]">
                {lang === "de"
                  ? "Lernen strukturiert umsetzen mit Scibly"
                  : "Put learning into practice with Scibly"}
              </p>
              <p className="text-ink-soft mt-2.5 mb-5 text-[14.5px] leading-[1.6] text-pretty">
                {lang === "de"
                  ? "Scibly ist das LMS für Teams, die Wissen schnell und strukturiert aufbauen wollen – ohne Corporate-Komplexität."
                  : "Scibly is the LMS for teams that want to build knowledge quickly and structurally — without corporate complexity."}
              </p>
              <Link
                href={routes.web.base.home}
                className={cn(actionClass, primaryActionClass)}
              >
                {lang === "de" ? "Scibly entdecken" : "Discover Scibly"}
                <Icon name="ArrowRight" className="h-3.5 w-3.5" />
              </Link>
            </div>
          </article>

          <aside className="hidden lg:block">
            <TableOfContents title={tBlog.onThisPage} />
          </aside>
        </MarketingSectionFrame>
      </main>
    </>
  );
}
