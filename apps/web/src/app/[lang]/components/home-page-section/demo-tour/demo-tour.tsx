"use client";

import type { Locale } from "@scibly/i18n/constants";

import { marketingDemoHref } from "@scibly/routes";

import { DemoChatPrompt } from "./demo-chat-prompt";
import { type DemoTourDictionary } from "./i18n/demo-tour.types";

interface DemoTourSectionProps {
  t: DemoTourDictionary;
  locale: Locale;
}

// No section title — this sits inside <Hero> as a continuation of it, not a second hero.
export function DemoTourSection({ t, locale }: DemoTourSectionProps) {
  const href = marketingDemoHref(locale, "notebook-demo");

  return (
    <div className="relative z-20 w-full overflow-visible">
      <div className="relative z-10 mx-auto w-full">
        <DemoChatPrompt t={t} href={href} locale={locale} />
      </div>
    </div>
  );
}
