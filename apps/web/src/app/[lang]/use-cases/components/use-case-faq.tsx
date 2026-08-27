"use client";

import type { Locale } from "@scibly/i18n/constants";
import type { FaqContext, FaqItem } from "@/components/faq/faq-list";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/app/[lang]/components/marketing-section-content";
import { FaqList } from "@/components/faq/faq-list";

interface UseCaseFaqProps {
  title: string;
  questions: FaqItem[];
  useCaseKey: string;
  locale: Locale;
  context?: FaqContext;
}

export function UseCaseFaq({
  title,
  questions,
  useCaseKey,
  locale,
  context = "use-case",
}: UseCaseFaqProps) {
  return (
    <MarketingSection
      aria-labelledby="use-case-faq-heading"
      frameClassName="max-w-[820px]"
    >
      <MarketingSectionHeader
        titleId="use-case-faq-heading"
        title={title}
        className="mb-10 items-center text-center"
      />

      <FaqList
        questions={questions}
        locale={locale}
        context={context}
        useCaseKey={useCaseKey}
      />
    </MarketingSection>
  );
}
