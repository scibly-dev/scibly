"use client";

import type { Locale } from "@scibly/i18n/constants";

import { linkClass } from "@scibly/ui/design-language";

import { MarketingAtmosphere } from "@/app/[lang]/components/marketing-grid-field";
import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/app/[lang]/components/marketing-section-content";
import { FaqList } from "@/components/faq/faq-list";

import { type FaqDictionary } from "./i18n/faq.types";

const FAQ_INDENTS = [
  "top-[16%] left-[4%] hidden xl:block",
  "right-[4%] bottom-[22%] hidden xl:block",
];

const EMAIL_PATTERN = /([\w.+-]+@[\w-]+\.[\w.-]+[\w])/;

function FaqSupportLine({ text }: { text: string }) {
  const [before, address, after] = text.split(EMAIL_PATTERN);
  if (!address) return text;

  return (
    <>
      {before}
      <a href={`mailto:${address}`} className={linkClass}>
        {address}
      </a>
      {after}
    </>
  );
}

interface FaqSectionProps {
  t: FaqDictionary;
  locale: Locale;
}

export function FaqSection({ t, locale }: FaqSectionProps) {
  return (
    <MarketingSection
      id="faq"
      aria-labelledby="faq-heading"
      sticky
      atmosphere={<MarketingAtmosphere indents={FAQ_INDENTS} />}
      frameClassName="grid items-start gap-[clamp(28px,4vw,60px)] lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]"
    >
      <MarketingSectionHeader
        titleId="faq-heading"
        eyebrow={t.eyebrow}
        title={t.title}
        description={<FaqSupportLine text={t.subtitle} />}
        layout="stacked"
        className="lg:sticky lg:top-[120px]"
      />

      <FaqList questions={t.questions} locale={locale} context="homepage" />
    </MarketingSection>
  );
}
