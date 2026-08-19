"use client";

import { autocaptureAttributes } from "@scibly/observability/autocapture";
import { cn } from "@scibly/ui/utils";
import { ArrowRight } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import { CHAPTER_ICONS } from "@/app/[lang]/components/marketing-chapter-icons";
import { MarketingAtmosphere } from "@/app/[lang]/components/marketing-grid-field";
import { MarketingSection } from "@/app/[lang]/components/marketing-section-content";
import {
  lipShadow,
  type PillarId,
  PILLARS,
} from "@/app/[lang]/components/marketing-tokens";
import { SciblyMark } from "@/components/brand-logo";

import { useCalendlyPopup } from "./calendly-embed";
import { type CtaDictionary } from "./i18n/cta.types";

interface CtaSectionProps {
  t: CtaDictionary;
}

const FLOATING_CHAPTERS: Array<{
  id: PillarId;
  position: string;
  delay: string;

  size?: number;
}> = [
  { id: "import", position: "top-[15%] left-[6%] rotate-[-8deg]", delay: "0s" },
  {
    id: "byoai",
    position: "top-[21%] right-[7.5%] rotate-[7deg]",
    delay: "-1.1s",
  },
  {
    id: "learner",
    position: "bottom-[16%] left-[11%] rotate-[6deg]",
    delay: "-2.2s",
  },
  {
    id: "analytics",
    position: "bottom-[13%] right-[12%] rotate-[-6deg]",
    delay: "-3.3s",
  },
  {
    id: "channels",
    position: "top-[54%] left-[2.5%] rotate-[10deg]",
    delay: "-4.4s",
    size: 21,
  },
];

export function CtaSection({ t }: CtaSectionProps) {
  const params = useParams();
  const locale = typeof params.lang === "string" ? params.lang : "de";
  const { openCalendly, scriptReady, calendlyScript } = useCalendlyPopup();

  useEffect(() => {
    if (window.location.hash !== "#cta-section") return;

    const frame = requestAnimationFrame(() => {
      document
        .getElementById("cta-section")
        ?.scrollIntoView({ block: "start" });
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <MarketingSection
      id="cta-section"
      aria-labelledby="cta-heading"
      atmosphere={
        <MarketingAtmosphere
          indents={[
            "top-[22%] left-[5%] hidden xl:block",
            "right-[5%] bottom-[24%] hidden xl:block",
          ]}
        />
      }
    >
      {calendlyScript}

      <div
        className="relative overflow-hidden rounded-[28px] border-2 px-[clamp(24px,5vw,80px)] py-[clamp(48px,6vw,92px)]"
        style={{
          backgroundImage: [
            "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1.2px)",
            "linear-gradient(145deg, #2a3da8 0%, #1d2f7a 48%, #14205a 100%)",
          ].join(", "),
          backgroundSize: "20px 20px, auto",
          borderColor: "rgba(255,255,255,0.16)",
          boxShadow: "0 5px 0 0 #0d1740, 0 40px 90px -50px rgba(19,28,70,0.85)",
        }}
      >
        {FLOATING_CHAPTERS.map(({ id, position, delay, size = 22 }) => {
          const { softColor, lipColor, accentColor } = PILLARS[id];
          const Icon = CHAPTER_ICONS[id];

          return (
            <div
              key={id}
              className={cn(
                "pointer-events-none absolute hidden lg:block",
                position,
              )}
              aria-hidden
            >
              <span
                className="sc-bob flex size-[54px] items-center justify-center rounded-[17px]"
                style={{
                  animationDelay: delay,
                  backgroundColor: softColor,
                  boxShadow: `${lipShadow(lipColor)}, 0 18px 34px -22px rgba(6,12,40,0.9)`,
                  color: accentColor,
                }}
              >
                <Icon size={size} strokeWidth={1.9} />
              </span>
            </div>
          );
        })}

        <div className="relative z-10 mx-auto flex max-w-[720px] flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-2.5 rounded-[14px] bg-[#b9d7ff] py-1.5 pr-4 pl-1.5 text-[13px] leading-none font-bold tracking-[-0.008em] text-[#0b4fb0] shadow-[0_3px_0_0_#7ab4ff,0_12px_26px_-18px_rgba(6,12,40,0.9),inset_0_1px_0_rgba(255,255,255,0.8)]">
            <SciblyMark
              size={26}
              alt=""
              className="rounded-lg shadow-[0_1px_2px_rgba(15,23,42,0.2)]"
            />
            {t.eyebrow}
          </span>

          <h2
            id="cta-heading"
            className="m-0 max-w-[22ch] text-[clamp(30px,3.6vw,48px)] leading-[1.12] font-medium tracking-[-0.026em] text-balance text-white"
          >
            {t.title}
          </h2>

          <button
            type="button"
            disabled={!scriptReady}
            aria-busy={!scriptReady}
            onClick={openCalendly}
            className="group text-ink ease-press mt-1 inline-flex h-[58px] cursor-pointer items-center gap-2.5 rounded-[18px] bg-white px-9 text-[16.5px] font-semibold tracking-[-0.012em] shadow-[0_5px_0_0_#a9b8e2] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_6px_0_0_#a9b8e2] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-[4px] active:shadow-[0_1px_0_0_#a9b8e2] disabled:cursor-progress disabled:opacity-60 motion-reduce:transition-none"
            {...autocaptureAttributes({
              cta: "calendly_demo",
              locale,
              placement: "homepage_cta",
            })}
          >
            {t.button}
            <ArrowRight
              size={17}
              className="transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden
            />
          </button>

          <p className="m-0 text-[13.5px] leading-[1.5] text-white/65">
            {t.hint}
          </p>
        </div>
      </div>
    </MarketingSection>
  );
}
