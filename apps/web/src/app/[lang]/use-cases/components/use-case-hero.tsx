import { HeroShell } from "../../components/hero-shell/hero-shell";
import { type HeroDictionary } from "../../components/home-page-section/hero/i18n/hero.types";
import { ScrollCtaButton } from "./scroll-cta-button";

interface UseCaseHeroProps {
  headline: string;
  subheadline: string;
  ctaLabel: string;
  imageAlt: string;
  openSource: HeroDictionary["openSource"];
}

export function UseCaseHero({
  headline,
  subheadline,
  ctaLabel,
  imageAlt,
  openSource,
}: UseCaseHeroProps) {
  return (
    <HeroShell
      alt={imageAlt}
      openSource={openSource}
      title={headline}
      subtitle={subheadline}
    >
      <div className="mt-[clamp(24px,4.4vh,40px)]">
        <ScrollCtaButton label={ctaLabel} />
      </div>
    </HeroShell>
  );
}
