"use client";

import type { Locale } from "@scibly/i18n/constants";

import { marketingDemoHref } from "@scibly/routes";
import {
  actionClass,
  primaryActionClass,
  subtitleClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import {
  ArrowRight,
  Blocks,
  Boxes,
  RefreshCw,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/app/[lang]/components/marketing-section-content";
import {
  lipShadow,
  tint,
  washStyle,
} from "@/app/[lang]/components/marketing-tokens";
import { useInViewOnce } from "@/components/in-view-reveal";

import { HeroProductTeaser } from "./hero-product-teaser";
import { type HeroDictionary } from "./i18n/hero.types";
import { ProductPreviewAtmosphere } from "./product-preview-atmosphere";
import {
  type ProductPreviewTab,
  WORKSPACE_PILLARS,
} from "./product-preview-modes";

interface ProductPreviewSectionProps {
  t: HeroDictionary;
  locale: Locale;
}

const TABS: ProductPreviewTab[] = ["notebook", "courseBuilder", "gamification"];

const POINT_ICONS = {
  notebook: [
    <Sparkles key="steer" size={17} strokeWidth={2} />,
    <Boxes key="workspaces" size={17} strokeWidth={2} />,
    <RefreshCw key="fresh" size={17} strokeWidth={2} />,
  ],
  courseBuilder: [
    <Users key="together" size={17} strokeWidth={2} />,
    <Blocks key="blocks" size={17} strokeWidth={2} />,
    <SlidersHorizontal key="control" size={17} strokeWidth={2} />,
  ],
  gamification: [
    <Shuffle key="mixed" size={17} strokeWidth={2} />,
    <Trophy key="progress" size={17} strokeWidth={2} />,
    <Sparkles key="grounded" size={17} strokeWidth={2} />,
  ],
} satisfies Record<ProductPreviewTab, [ReactNode, ReactNode, ReactNode]>;

const REVEAL_EASING = "ease-[cubic-bezier(0.22,1,0.36,1)]";

export function ProductPreviewSection({
  t,
  locale,
}: ProductPreviewSectionProps) {
  const { ref: sectionRef, inView: hasSeen } = useInViewOnce<HTMLElement>(0.12);
  const [tab, setTab] = useState<ProductPreviewTab>("notebook");

  const active = t.tabs[tab];
  const pillar = WORKSPACE_PILLARS[tab];

  const handleTabChange = (next: ProductPreviewTab) => {
    if (next === tab) return;
    const y = window.scrollY;
    setTab(next);
    requestAnimationFrame(() => window.scrollTo(0, y));
  };

  return (
    <MarketingSection
      id="product-preview"
      ref={sectionRef}
      aria-labelledby="product-preview-heading"
      className="scroll-mt-16"
      atmosphere={<ProductPreviewAtmosphere />}
    >
      <div className="sc-reveal">
        <MarketingSectionHeader
          titleId="product-preview-heading"
          eyebrow={t.previewSection.eyebrow}
          title={t.previewSection.title}
        />

        <div
          role="tablist"
          aria-labelledby="product-preview-heading"
          className="mt-[clamp(28px,4vh,40px)] flex w-max max-w-full gap-[5px] rounded-full bg-[#e3e7ee] p-[5px]"
        >
          {TABS.map((id) => {
            const selected = id === tab;
            const tone = WORKSPACE_PILLARS[id];

            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="product-preview-stage"
                onClick={() => handleTabChange(id)}
                className={cn(
                  "ease-press min-h-10 cursor-pointer rounded-full px-4 text-[13px] font-bold whitespace-nowrap md:px-5 md:text-[14px]",
                  "transition-[translate,box-shadow,background-color,color] duration-100",
                  "focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 focus-visible:outline-none",
                  selected
                    ? "bg-white active:translate-y-[2px] active:shadow-none"
                    : "text-ink-muted hover:text-ink hover:bg-white/55",
                )}
                style={
                  selected
                    ? {
                        color: tone.accentColor,
                        boxShadow: lipShadow(tone.lipColor, 2),
                      }
                    : undefined
                }
              >
                {t.tabs[id].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-[clamp(22px,3vh,30px)]">
        <p
          key={tab}
          className={cn(subtitleClass, "product-copy-swap max-w-[62ch]")}
        >
          {active.description}
        </p>
      </div>

      <div className="mt-[clamp(26px,4vh,38px)] grid gap-[clamp(18px,2.4vw,26px)]">
        {/* The stage wears the mode's tint, the same wash the platform
            chapters use */}
        <div
          className={cn(
            "sc-reveal min-w-0 rounded-[28px] border p-3 duration-700 md:p-[18px]",
            // The wash still transitions, because switching tabs recolours the
            // stage in place. Only the entrance moved to the scroll timeline.
            "transition-[background-color,border-color,box-shadow]",
            REVEAL_EASING,
          )}
          style={washStyle(pillar)}
        >
          <div id="product-preview-stage" role="tabpanel">
            <div key={tab} className="product-preview-swap">
              <HeroProductTeaser t={t} tab={tab} ready={hasSeen} />
            </div>
          </div>
        </div>

        {/* Three captions for the stage above, not a feature list: the label
            is the whole point and the line under it is the fine print. */}
        <ul
          key={tab}
          className="product-copy-swap m-0 grid list-none gap-[clamp(10px,1.4vw,14px)] p-0 sm:grid-cols-3"
        >
          {active.points.map((point, index) => (
            <li
              key={point.label}
              className="rounded-[18px] border-2 bg-white px-[18px] py-[17px]"
              style={{
                borderColor: tint(pillar.softColor, 70),
                boxShadow: lipShadow(tint(pillar.lipColor, 42)),
              }}
            >
              <span
                className="mb-3 inline-flex size-[30px] items-center justify-center rounded-[10px]"
                style={{
                  backgroundColor: pillar.softColor,
                  boxShadow: lipShadow(pillar.lipColor, 2),
                  color: pillar.accentColor,
                }}
                aria-hidden
              >
                {POINT_ICONS[tab][index]}
              </span>
              <p className="text-ink m-0 text-[15px] leading-[1.35] font-semibold tracking-[-0.012em]">
                {point.label}
              </p>
              <p className="text-ink-soft m-0 mt-1 text-[14px] leading-[1.5] text-pretty">
                {point.text}
              </p>
            </li>
          ))}
        </ul>

        <a
          href={marketingDemoHref(locale, "product_preview_demo")}
          className={cn(
            actionClass,
            primaryActionClass,
            "group mt-[clamp(6px,1vh,12px)] justify-self-start",
          )}
        >
          {t.previewSection.demoCta}
          <ArrowRight
            size={15}
            strokeWidth={2.4}
            className="transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </a>
      </div>
    </MarketingSection>
  );
}
