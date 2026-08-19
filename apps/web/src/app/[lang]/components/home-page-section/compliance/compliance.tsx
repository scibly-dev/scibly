import { actionClass, primaryActionClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { ArrowRight } from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/app/[lang]/components/marketing-section-content";

import { ComplianceAtmosphere } from "./compliance-atmosphere";
import { type ComplianceDictionary } from "./i18n/compliance.types";
import { SECURITY_CLAIMS, toSecurityClaimId } from "./security-claims";

interface ComplianceSectionProps {
  t: ComplianceDictionary;
}

const MARK_FONT = 'ui-monospace, "SFMono-Regular", Menlo, monospace';

export function ComplianceSection({ t }: ComplianceSectionProps) {
  return (
    <MarketingSection
      id="security"
      aria-labelledby="security-heading"
      atmosphere={<ComplianceAtmosphere />}
    >
      <MarketingSectionHeader
        titleId="security-heading"
        eyebrow={t.eyebrow}
        title={`${t.title} ${t.titleEmphasis}`}
        description={t.subtitle}
        action={
          <a
            href="#cta-section"
            className={cn(actionClass, primaryActionClass, "group")}
          >
            {t.cta}
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </a>
        }
      />

      <ul
        className="m-0 mt-[clamp(34px,5vh,56px)] grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4"
        aria-label={t.registry.summary}
      >
        {t.controls.map((control) => {
          const kind = toSecurityClaimId(control.kind);
          if (!kind) return null;
          const { softColor, lipColor, accentColor } =
            SECURITY_CLAIMS[kind].pillar;

          return (
            <li
              key={control.kind}
              className="flex flex-col rounded-[22px] border-2 p-[26px] sm:min-h-[190px]"
              style={{
                backgroundColor: `color-mix(in srgb, ${softColor} 34%, #ffffff)`,
                borderColor: `color-mix(in srgb, ${softColor} 74%, #ffffff)`,
                boxShadow: `0 4px 0 0 color-mix(in srgb, ${lipColor} 60%, #ffffff), 0 20px 40px -30px rgba(19,28,70,0.4)`,
              }}
            >
              <span
                className="inline-flex h-10 items-center self-start rounded-[12px] border-2 bg-white px-3 text-[19px] leading-none font-semibold tracking-[-0.02em]"
                style={{
                  borderColor: `color-mix(in srgb, ${softColor} 84%, #ffffff)`,
                  boxShadow: `0 3px 0 0 color-mix(in srgb, ${lipColor} 70%, #ffffff)`,
                  color: accentColor,
                  fontFamily: MARK_FONT,
                }}
              >
                {control.value}
              </span>

              <div className="pt-5">
                <h3 className="text-ink m-0 text-[16px] leading-[1.25] font-semibold tracking-[-0.015em]">
                  {control.label}
                </h3>
                <p className="mt-2.5 mb-0 text-[13.5px] leading-[1.55] text-pretty text-[#5b6478]">
                  {control.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </MarketingSection>
  );
}
