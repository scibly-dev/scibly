import { cn } from "@scibly/ui/utils";
import Image from "next/image";

import {
  panelStyle,
  productColumnClass,
  productLabelClass,
  productPanelClass,
  productRootClass,
} from "@/app/[lang]/components/home-page-section/product-surface";
import {
  keyStyle,
  panelKey,
  PILLARS,
} from "@/app/[lang]/components/marketing-tokens";
import { SCIBLY_MARK_SRC } from "@/lib/marketing-assets";

import { BENTO_EASE } from "../keyframes";
import { type FeatureShowcaseDictionary } from "./i18n/feature-showcase.types";

type AnalyticsCopy = FeatureShowcaseDictionary["analytics"];

const PILLAR = PILLARS.analytics;

const BAR_RESTING = "#f2e6d6";
const BAR_ELEVATED = "#e0b183";

export function AnalyticsVisual({ t }: { t: AnalyticsCopy }) {
  return (
    <div data-bento-visual className={productRootClass}>
      <div className={cn(productColumnClass, "justify-center gap-2.5")}>
        <Conversation t={t} />
      </div>
    </div>
  );
}

export function AnalyticsDetailStage({ t }: { t: AnalyticsCopy }) {
  return (
    <div className="mx-auto max-w-[560px]">
      <div
        data-bento-anim
        className={cn(productPanelClass, "min-h-[440px] gap-2.5")}
        style={panelStyle(PILLAR, "200ms")}
      >
        <Conversation t={t} />
      </div>
    </div>
  );
}

function Conversation({ t }: { t: AnalyticsCopy }) {
  if (t.series.length === 0) return null;
  const [firstWeek, ...laterWeeks] = t.series;
  const peak = laterWeeks.reduce(
    (worst, point) => (point.rate > worst.rate ? point : worst),
    firstWeek,
  );
  const peakIndex = t.series.indexOf(peak);

  return (
    <>
      <div
        data-bento-anim
        className="flex shrink-0 flex-col items-end gap-1.5"
        style={{ animation: `sc-rise 700ms ${BENTO_EASE} 380ms both` }}
      >
        <span className={cn(productLabelClass, "pr-1")}>{t.youLabel}</span>
        <span
          className="text-ink max-w-[92%] rounded-[14px] px-3.5 py-2 text-[15px] leading-snug font-semibold"
          style={{
            backgroundColor: PILLAR.softColor,
            boxShadow: `0 3px 0 0 ${PILLAR.lipColor}`,
          }}
        >
          {t.query}
        </span>
      </div>

      <div
        data-bento-anim
        className="flex shrink-0 items-center gap-2"
        style={{ animation: `sc-fade-in 650ms ${BENTO_EASE} 620ms both` }}
      >
        <span
          className="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-[8px]"
          style={{ backgroundColor: PILLAR.softColor }}
        >
          <Image src={SCIBLY_MARK_SRC} alt="" width={14} height={14} />
        </span>
        <span className="text-ink text-[13.5px] font-bold">{t.replyLabel}</span>
      </div>

      <div
        data-bento-anim
        className="flex min-h-0 flex-1 flex-col gap-2.5 rounded-[16px] border-2 px-4 py-3"
        style={{
          ...keyStyle(panelKey(PILLAR)),
          animation: `sc-rise 750ms ${BENTO_EASE} 760ms both`,
        }}
      >
        <div className="flex shrink-0 items-baseline justify-between gap-3">
          <span className="text-ink min-w-0 truncate text-[14px] font-bold">
            {t.chartLabel}
          </span>
          <span
            className="shrink-0 text-[24px] leading-none font-bold"
            style={{ color: PILLAR.accentColor }}
            aria-label={t.peakLabel}
          >
            {peak.rate}%
          </span>
        </div>

        <div
          className="flex min-h-[48px] flex-1 gap-2"
          role="img"
          aria-label={t.chartLabel}
        >
          {t.series.map((point, index) => (
            <span
              key={point.label}
              className="flex min-w-0 flex-1 flex-col gap-1.5"
            >
              <span className="flex flex-1 items-end">
                <span
                  data-bento-anim
                  className="w-full origin-bottom rounded-t-[5px] rounded-b-[3px]"
                  style={{
                    height: `${Math.round((point.rate / peak.rate) * 100)}%`,
                    backgroundColor:
                      index === peakIndex
                        ? PILLAR.accentColor
                        : index > peakIndex
                          ? BAR_ELEVATED
                          : BAR_RESTING,
                    animation: `sc-grow-y 700ms ${BENTO_EASE} ${900 + index * 70}ms both`,
                  }}
                />
              </span>
              <span className="text-ink-soft w-full truncate text-center text-[11px] font-semibold">
                {point.label}
              </span>
            </span>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-[#f1f3f6] pt-2">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: PILLAR.accentColor }}
            aria-hidden
          />
          <span className="text-ink-soft min-w-0 flex-1 truncate text-[12.5px]">
            {t.eventLabel}
          </span>
        </div>
      </div>

      <p
        data-bento-anim
        className="m-0 max-w-[95%] shrink-0 rounded-[14px] border-2 border-[#e7eaf0] bg-white px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-[#3b4574]"
        style={{
          boxShadow: "0 3px 0 0 #eceff5",
          animation: `sc-rise 700ms ${BENTO_EASE} 1320ms both`,
        }}
      >
        {t.gapBody}
      </p>
    </>
  );
}
