"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { MarketingSectionFrame } from "@/app/[lang]/components/marketing-section-frame";

import { type HeroDictionary } from "./i18n/hero.types";

// GDPR: nothing is requested from YouTube until the visitor clicks.
export function HeroVideo({ t }: { t: Pick<HeroDictionary, "video"> }) {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="font-display relative z-10 bg-white">
      <MarketingSectionFrame className="px-5 pt-[clamp(34px,5.5vh,58px)] md:px-[clamp(20px,5vw,40px)]">
        <div className="relative mx-auto w-full max-w-[880px]">
          <div
            className="pointer-events-none absolute inset-x-10 -bottom-2 h-[86px] rounded-[50%] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(15,23,42,0.1)_0%,rgba(15,23,42,0)_74%)] blur-[30px]"
            aria-hidden
          />

          <div className="relative aspect-video overflow-hidden rounded-[20px] bg-[#0e1630] shadow-[0_4px_0_0_var(--color-lip),0_24px_48px_-36px_rgba(15,23,42,0.55)]">
            {playing ? (
              <iframe
                src="https://www.youtube-nocookie.com/embed/TcpLUNBRhQw?autoplay=1&rel=0&modestbranding=1"
                title={t.video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                /* Taller than 16:9 so sub-pixel rounding lands in the overflow instead of a bar down either edge. */
                className="absolute -top-0.5 left-0 h-[calc(100%+4px)] w-full border-0"
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={t.video.play}
                className="group absolute inset-0 h-full w-full cursor-pointer focus-visible:ring-4 focus-visible:ring-[#0066FF]/35 focus-visible:outline-none"
              >
                <Image
                  src="/images/video-tour-poster.webp"
                  alt=""
                  width={1280}
                  height={720}
                  sizes="(max-width: 880px) 100vw, 880px"
                  className="absolute inset-0 h-full w-full scale-[1.01] object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
                />
                <span
                  className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,32,0.28)_0%,rgba(8,14,32,0.1)_38%,rgba(8,14,32,0.62)_100%)]"
                  aria-hidden
                />

                <span className="absolute inset-0 flex flex-col items-center justify-center gap-[18px]">
                  <span className="ease-press inline-flex h-[68px] w-[68px] items-center justify-center rounded-full bg-[#0066FF] text-white shadow-[0_5px_0_0_#0046ad,0_12px_28px_-10px_rgba(0,44,110,0.7),inset_0_1px_0_rgba(255,255,255,0.3)] transition-[translate,box-shadow,background-color] duration-100 group-hover:bg-[#1a76ff] group-active:translate-y-[5px] group-active:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                    <Play
                      size={24}
                      className="ml-[3px] fill-current"
                      aria-hidden
                    />
                  </span>
                  <span className="text-[15px] font-bold tracking-[0.002em] text-white [text-shadow:0_1px_10px_rgba(8,14,32,0.5)]">
                    {t.video.label}
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>
      </MarketingSectionFrame>
    </section>
  );
}
