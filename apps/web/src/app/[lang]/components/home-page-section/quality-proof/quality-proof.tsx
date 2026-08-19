import { CYBER_SAFETY_COURSE_ID } from "@scibly/course-content/cyber-safety";
import { type Locale } from "@scibly/i18n/constants";
import { marketingCourseHref, marketingDemoHref } from "@scibly/routes";
import {
  actionClass,
  eyebrowClass,
  primaryActionClass,
  subtitleClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { GraduationCap, Play } from "lucide-react";
import { type ReactNode } from "react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/app/[lang]/components/marketing-section-content";

import { type QualityProofDictionary } from "./i18n/quality-proof.types";
import { QualitySystemMap } from "./quality-system-map";

interface QualityProofSectionProps {
  t: QualityProofDictionary;
  locale: Locale;
}

const RULE_COLOR = "#e6eaf5";

export function QualityProofSection({ t, locale }: QualityProofSectionProps) {
  return (
    <MarketingSection
      id="quality-proof"
      aria-labelledby="quality-proof-heading"
      atmosphere={null}
    >
      <MarketingSectionHeader
        titleId="quality-proof-heading"
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.subtitle}
      />

      <div
        className="mt-[clamp(34px,5vh,56px)] h-px"
        style={{ backgroundColor: RULE_COLOR }}
        aria-hidden
      />

      <div className="mt-[clamp(30px,5vh,46px)] md:mt-[clamp(40px,6vh,64px)]">
        <QualitySystemMap t={t} />
      </div>

      <section
        className="mt-[clamp(52px,7vh,84px)] flex flex-col gap-4 border-t pt-[clamp(34px,5vh,50px)]"
        style={{ borderColor: RULE_COLOR }}
        aria-labelledby="quality-differentiation-title"
      >
        <h2
          id="quality-differentiation-title"
          className="text-ink m-0 text-[clamp(24px,2.6vw,34px)] leading-[1.14] font-semibold tracking-[-0.024em]"
        >
          {t.differentiation.title}
        </h2>
        <p className={cn(subtitleClass, "max-w-[64ch]")}>
          {t.differentiation.body}
        </p>
      </section>

      <div className="mt-[clamp(52px,7vh,84px)] grid gap-[clamp(20px,3vw,38px)] md:grid-cols-2">
        <ClosingCard
          id="quality-notebook-cta"
          lip="#dfe9f7"
          t={t.cta.notebook}
          action={
            <a
              href={marketingDemoHref(locale, "quality_proof_notebook_demo")}
              className={cn(actionClass, primaryActionClass, "mt-6")}
            >
              <Play size={13} className="fill-current" aria-hidden />
              {t.cta.notebook.label}
            </a>
          }
        />

        <ClosingCard
          id="quality-course-cta"
          lip="#dcf0e3"
          t={t.cta.course}
          action={
            <a
              href={marketingCourseHref(
                locale,
                CYBER_SAFETY_COURSE_ID,
                "quality_proof_course_demo",
              )}
              className={cn(actionClass, primaryActionClass, "mt-6")}
            >
              <GraduationCap size={14} aria-hidden />
              {t.cta.course.label}
            </a>
          }
        />
      </div>
    </MarketingSection>
  );
}

function ClosingCard({
  id,
  lip,
  t,
  action,
}: {
  id: string;
  lip: string;
  t: { eyebrow: string; title: string; body: string };
  action: ReactNode;
}) {
  return (
    <section
      className="flex flex-col items-start rounded-2xl border border-[#e7eaf0] bg-white px-6 py-7"
      style={{
        boxShadow: `0 3px 0 0 ${lip}, 0 6px 14px -8px rgba(15,23,42,0.16)`,
      }}
      aria-labelledby={`${id}-title`}
    >
      <p className={eyebrowClass}>{t.eyebrow}</p>
      <h3
        id={`${id}-title`}
        className="text-ink mt-2.5 mb-0 text-[clamp(20px,2vw,26px)] leading-[1.14] font-semibold tracking-[-0.024em]"
      >
        {t.title}
      </h3>
      <p className="text-ink-soft mt-2 mb-0 max-w-[44ch] text-[14.5px] leading-[1.55] text-pretty">
        {t.body}
      </p>
      {action}
    </section>
  );
}
