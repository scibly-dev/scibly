import { Quote } from "lucide-react";
import Image from "next/image";

import { MarketingSection } from "@/app/[lang]/components/marketing-section-content";
import {
  lipShadow,
  PILLARS,
  tint,
} from "@/app/[lang]/components/marketing-tokens";

import { type FounderDictionary } from "./i18n/founder.types";

const warm = PILLARS.analytics;

interface FounderSectionProps {
  t: FounderDictionary;
}

export function FounderSection({ t }: FounderSectionProps) {
  return (
    <MarketingSection id="founders" aria-labelledby="founder-quote">
      <div
        className="relative mx-auto flex max-w-[980px] flex-col gap-[clamp(28px,4vw,52px)] rounded-[28px] border-2 p-[clamp(26px,4vw,56px)] md:flex-row md:items-center"
        style={{
          backgroundColor: tint(warm.softColor, 30),

          backgroundImage: `radial-gradient(circle, color-mix(in srgb, ${warm.accentColor} 9%, transparent) 1px, transparent 1.2px)`,
          backgroundSize: "18px 18px",
          borderColor: tint(warm.softColor, 72),
          boxShadow: `${lipShadow(tint(warm.lipColor, 62))}, 0 26px 56px -34px rgba(122,60,10,0.35)`,
        }}
      >
        <div className="flex shrink-0 flex-col items-start gap-4 text-left md:w-[212px] md:items-center md:text-center">
          <div className="flex">
            <FounderPortrait src={t.imageSrcFelix} alt={t.imageAltFelix} />
            <div className="-ml-4">
              <FounderPortrait src={t.imageSrcNiclas} alt={t.imageAltNiclas} />
            </div>
          </div>
          <div>
            <div className="text-ink text-[14.5px] leading-tight font-semibold">
              {t.attribution}
            </div>
            <div className="text-ink-soft mt-1 text-[13px] leading-tight">
              {t.role}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <span
            className="flex size-9 shrink-0 items-center justify-center self-start rounded-[12px] border-2 bg-white"
            style={{
              borderColor: tint(warm.softColor, 82),
              boxShadow: lipShadow(tint(warm.lipColor, 70), 3),
            }}
            aria-hidden
          >
            <Quote
              size={15}
              className="fill-current"
              style={{ color: warm.accentColor }}
            />
          </span>

          <blockquote
            id="founder-quote"
            className="text-ink m-0 text-[clamp(24px,2.6vw,34px)] leading-[1.28] font-medium tracking-[-0.022em] text-balance"
          >
            {t.quote}
          </blockquote>

          <p className="text-ink-muted m-0 text-[16.5px] leading-[1.65] text-pretty">
            {t.body}
          </p>
        </div>
      </div>
    </MarketingSection>
  );
}

function FounderPortrait({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="relative size-[92px] overflow-hidden rounded-full border-4 border-white lg:size-[108px]"
      style={{
        boxShadow: `${lipShadow(tint(warm.lipColor, 78), 3)}, 0 14px 28px -18px rgba(122,60,10,0.5)`,
      }}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes="108px" />
    </div>
  );
}
