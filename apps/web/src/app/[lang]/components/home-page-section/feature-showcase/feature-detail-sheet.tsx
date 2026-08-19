"use client";

import type { Locale } from "@scibly/i18n/constants";

import { marketingDemoHref } from "@scibly/routes";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@scibly/ui/components/sheet";
import {
  actionClass,
  primaryActionClass,
  secondaryActionClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { ArrowRight, Check, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  keyShadow,
  type PillarId,
  PILLARS,
} from "@/app/[lang]/components/marketing-tokens";

import { FEATURE_CARDS } from "./feature-cards";
import {
  type FeatureDetailCopy,
  type FeatureShowcaseDictionary,
} from "./i18n/feature-showcase.types";

function DetailBody({
  id,
  phase,
  title,
  detail,
  t,
  locale,
  onClose,
}: {
  id: PillarId;
  phase: string;
  title: string;
  detail: FeatureDetailCopy;
  t: FeatureShowcaseDictionary;
  locale: Locale;
  onClose: () => void;
}) {
  const pillar = PILLARS[id];

  const pillarKeyStyle = {
    backgroundColor: pillar.softColor,
    color: pillar.accentColor,
    boxShadow: keyShadow(pillar.lipColor),
  };

  return (
    <div className="font-display flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
      <div className="relative shrink-0 px-5 pt-9 pb-7 sm:px-7 md:px-10 md:pt-11 md:pb-8">
        <button
          type="button"
          onClick={onClose}
          aria-label={t.closeLabel}
          className="border-ink/[0.08] text-ink-muted ease-press absolute top-4 right-4 flex size-9 items-center justify-center rounded-[10px] border bg-white shadow-[0_2px_0_0_rgba(19,28,70,0.07),0_4px_10px_-6px_rgba(15,35,61,0.3)] transition-[translate,box-shadow] duration-100 hover:bg-[#f7f9fd] active:translate-y-0.5 active:shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] md:top-6 md:right-8"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        <div className="mx-auto grid max-w-[1080px] gap-6 pr-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-12 md:pr-12">
          <div>
            <span
              className="inline-flex rounded-[9px] px-[13px] py-[7px] text-[11.5px] font-bold tracking-[0.002em]"
              style={pillarKeyStyle}
            >
              {phase}
            </span>
            <h2 className="text-ink mt-4 mb-0 text-[clamp(22px,2.4vw,32px)] leading-[1.14] font-semibold tracking-[-0.024em] text-balance">
              {title}
            </h2>
            <p className="text-ink-muted mt-3 mb-0 max-w-[54ch] text-[15.5px] leading-[1.6] text-pretty">
              {detail.body}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#cta-section"
                onClick={() => onClose()}
                className={cn(
                  actionClass,
                  primaryActionClass,
                  "group w-full sm:w-auto",
                )}
              >
                {t.ctaPrimary}
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </a>
              <a
                href={marketingDemoHref(locale, "feature_detail_demo")}
                className={cn(
                  actionClass,
                  secondaryActionClass,
                  "w-full sm:w-auto",
                )}
              >
                {t.ctaSecondary}
              </a>
            </div>
          </div>

          <ul className="m-0 flex list-none flex-col gap-3.5 p-0 md:pt-1">
            {detail.highlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  className="mt-px flex size-6 shrink-0 items-center justify-center rounded-[8px]"
                  style={pillarKeyStyle}
                  aria-hidden
                >
                  <Check size={13} strokeWidth={3} />
                </span>
                <span className="text-ink-muted text-[14.5px] leading-[1.5] font-medium">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative shrink-0 border-t border-[#e6eaf5] bg-[#fbfbfd] px-4 pt-6 pb-7 sm:px-6 md:px-10 md:pt-8 md:pb-10">
        <div className="mx-auto max-w-[1080px]">
          {FEATURE_CARDS.find((card) => card.id === id)?.detail(t)}
        </div>
      </div>
    </div>
  );
}

interface FeatureDetailSheetProps {
  featureId: PillarId | null;
  t: FeatureShowcaseDictionary;
  locale: Locale;
  onOpenChange: (open: boolean) => void;
}

export function FeatureDetailSheet({
  featureId,
  t,
  locale,
  onOpenChange,
}: FeatureDetailSheetProps) {
  const [renderedId, setRenderedId] = useState<PillarId | null>(featureId);
  const open = featureId !== null;

  useEffect(() => {
    if (!featureId) return;

    const updateRenderedFeature = window.setTimeout(() => {
      setRenderedId(featureId);
    }, 0);

    return () => window.clearTimeout(updateRenderedFeature);
  }, [featureId]);

  const activeId = featureId ?? renderedId;
  const feature = activeId ? t[activeId] : null;

  if (!feature || !activeId) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        overlayClassName="z-[120] bg-[#0b1220]/40 backdrop-blur-[2px]"
        className={cn(
          "z-[120] flex flex-col gap-0 overflow-hidden border-0 bg-white p-0",
          "inset-x-0 w-full max-w-none",
          "h-[min(94dvh,960px)]",
          "sm:right-3 sm:left-3 sm:h-[min(92dvh,920px)] sm:w-auto",
          "md:right-4 md:left-4 md:h-[min(90dvh,940px)]",
          "lg:right-5 lg:left-5 lg:h-[min(90dvh,960px)]",
          "xl:right-[12%] xl:left-[12%] xl:h-[min(88dvh,900px)]",
          "2xl:right-[17.5%] 2xl:left-[17.5%] 2xl:h-[min(88dvh,880px)]",
          "rounded-t-[24px] shadow-[0_-24px_64px_rgba(15,23,42,0.22)]",
          "data-[state=closed]:duration-300 data-[state=open]:duration-500",
          "[&>button]:hidden",
        )}
      >
        <SheetTitle className="sr-only">{feature.title}</SheetTitle>
        <SheetDescription className="sr-only">
          {feature.detail.body}
        </SheetDescription>
        <DetailBody
          id={activeId}
          phase={feature.phase}
          title={feature.title}
          detail={feature.detail}
          t={t}
          locale={locale}
          onClose={() => onOpenChange(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
