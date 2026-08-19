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
import { Terminal } from "lucide-react";

import { getFullDictionary } from "@/i18n/dictionaries";

import { CtaSection } from "../components/home-page-section/cta/cta";
import { MarketingSection } from "../components/marketing-section-content";
import { AiSkillsGrid } from "./components/ai-skills-grid";
import { SKILLS, SKILLS_PAGE_CONTENT } from "./data";

export async function generateMetadata(props: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await props.params;
  const content = SKILLS_PAGE_CONTENT[lang];
  const base = routes.web.base.home.replace(/\/$/, "");
  const canonicalUrl = `${base}${appendLocalePrefix(lang, "/ai-skills")}`;

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
        de: `${base}${appendLocalePrefix("de", "/ai-skills")}`,
        en: `${base}${appendLocalePrefix("en", "/ai-skills")}`,
      },
    },
  };
}

export default async function AiSkillsPage(props: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await props.params;
  const content = SKILLS_PAGE_CONTENT[lang];
  const dict = await getFullDictionary(lang);

  return (
    <main className="flex flex-col bg-white">
      <MarketingSection top="page" frameClassName="pb-[clamp(40px,6vh,64px)]">
        <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
          <p className={eyebrowClass}>
            Open Source ·{" "}
            <a
              href="https://github.com/scibly-dev/skills"
              target="_blank"
              rel="noopener noreferrer"
              className="text-link decoration-link/30 hover:decoration-link underline underline-offset-2 transition-colors"
            >
              scibly-dev/skills
            </a>
          </p>

          <h1 className={cn(pageTitleClass, "mt-4 whitespace-pre-line")}>
            {content.hero.headline}
          </h1>

          <p className={cn(subtitleClass, "mt-5 max-w-[540px]")}>
            {content.hero.subheadline}
          </p>

          {/* Install command */}
          <div className="border-hairline mt-9 inline-flex max-w-full items-center gap-2.5 rounded-[14px] border-2 bg-white py-3 pr-4 pl-3.5 shadow-[0_4px_0_0_var(--color-lip)]">
            <Terminal
              size={15}
              strokeWidth={2.4}
              className="text-ink-faint shrink-0"
              aria-hidden
            />
            <code className="text-ink font-mono text-[13px] font-medium select-all">
              npx skills add scibly-dev/skills --all
            </code>
          </div>
        </div>
      </MarketingSection>

      <AiSkillsGrid locale={lang} skills={SKILLS} content={content} />

      <CtaSection t={dict.cta} />
    </main>
  );
}
