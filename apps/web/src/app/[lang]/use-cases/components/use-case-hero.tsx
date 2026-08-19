import {
  eyebrowClass,
  pageTitleClass,
  subtitleClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";

import { MarketingSection } from "../../components/marketing-section-content";
import { ScrollCtaButton } from "./scroll-cta-button";

interface UseCaseHeroProps {
  eyebrow: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
}

export function UseCaseHero({
  eyebrow,
  headline,
  subheadline,
  ctaLabel,
}: UseCaseHeroProps) {
  return (
    <MarketingSection top="page" frameClassName="pb-[clamp(56px,8vh,96px)]">
      <div className="mx-auto flex max-w-[820px] flex-col items-center text-center">
        <p className={eyebrowClass}>{eyebrow}</p>
        <h1 className={cn(pageTitleClass, "mt-4")}>{headline}</h1>
        <p className={cn(subtitleClass, "mt-5 max-w-[580px]")}>{subheadline}</p>
        <div className="mt-9">
          <ScrollCtaButton label={ctaLabel} />
        </div>
      </div>
    </MarketingSection>
  );
}
