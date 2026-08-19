"use client";

import { titleClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { Check } from "lucide-react";

import { CHAPTER_ICONS } from "@/app/[lang]/components/marketing-chapter-icons";
import { MarketingSection } from "@/app/[lang]/components/marketing-section-content";
import {
  lipShadow,
  type PillarId,
  PILLARS,
  tint,
  toPillarId,
} from "@/app/[lang]/components/marketing-tokens";
import { SciblyMark } from "@/components/brand-logo";
import { useInViewOnce } from "@/components/in-view-reveal";

import { type ComparisonDictionary } from "./i18n/comparison.types";

interface ComparisonSectionProps {
  t: ComparisonDictionary;
}

const GROOVE_EDGE = "#dfe4f0";
const GROOVE_RULE = "#e7eaf3";
const BOARD_EDGE = "#bcd7ff";
const BOARD_RULE = "#e4eefe";

const columnsClass =
  "sm:grid-cols-[minmax(120px,0.52fr)_minmax(0,1fr)_minmax(0,1.16fr)] sm:gap-x-[clamp(10px,1.4vw,18px)]";
const laneCellClass =
  "px-4 py-3 sm:flex sm:items-center sm:px-[clamp(16px,2.2vw,28px)] sm:py-[clamp(14px,1.8vw,19px)]";

const laneNameClass = "sr-only sm:hidden";

const boardKeyClass =
  "mt-[1px] inline-flex shrink-0 items-center gap-[7px] rounded-[11px] bg-[#0066FF] px-[11px] py-[7px] text-[11.5px] leading-none font-bold text-white shadow-[0_2px_0_0_#0046ad] transition-transform duration-150 ease-press group-hover:-translate-y-[2px] sm:mt-0 sm:size-[26px] sm:justify-center sm:gap-0 sm:rounded-[8px] sm:p-0";

export function ComparisonSection({ t }: ComparisonSectionProps) {
  const { ref, inView } = useInViewOnce<HTMLElement>(0.16);
  const lastIndex = t.table.rows.length - 1;

  return (
    <MarketingSection
      ref={ref}
      id="comparison"
      aria-labelledby="comparison-heading"
    >
      <h2 id="comparison-heading" className={cn(titleClass, "max-w-[680px]")}>
        {t.title1} {t.title2}
      </h2>

      <div className="mt-[clamp(34px,5vh,56px)]">
        <div
          className={cn(
            "hidden sm:grid sm:items-end sm:pb-[22px]",
            columnsClass,
          )}
        >
          <span />
          <span className="px-[clamp(16px,2.2vw,28px)] text-[12px] leading-none font-semibold tracking-[0.02em] text-[#8a93a8]">
            {t.table.headers.legacy}
          </span>
          <span className="px-[clamp(16px,2.2vw,28px)]">
            <span className="inline-flex items-center gap-[6px] rounded-full bg-[#0066FF] py-[5px] pr-3 pl-[9px] text-[11.5px] leading-none font-bold text-white shadow-[0_2px_0_0_#0046ad]">
              <SciblyMark size={14} className="rounded-[4px]" />
              {t.table.headers.scibly}
            </span>
          </span>
        </div>

        {/* Legend for the stacked mobile cards, which carry their per-row lane names as sr-only. */}
        <div
          className="mb-4 flex items-center gap-5 px-1.5 sm:hidden"
          aria-hidden
        >
          <span className="flex items-center gap-2 text-[12.5px] font-semibold text-[#a6adbf]">
            <span className="h-[2px] w-3 rounded-full bg-[#c6ccdb]" />
            {t.table.headers.legacy}
          </span>
          <span className={boardKeyClass}>
            <SciblyMark size={13} className="rounded-[3px]" />
            {t.table.headers.scibly}
            <Check size={13} strokeWidth={3} />
          </span>
        </div>

        <ul className="m-0 grid list-none gap-2.5 p-0 sm:block sm:gap-0">
          {t.table.rows.map((row, index) => {
            const kind = toPillarId(row.kind);
            if (!kind) return null;
            const pillar = PILLARS[kind];
            const isFirst = index === 0;
            const isLast = index === lastIndex;

            return (
              <li
                key={row.label}
                className={cn(
                  "group grid transition-opacity duration-500 ease-out motion-reduce:transition-none",
                  "max-sm:border-hairline max-sm:overflow-hidden max-sm:rounded-[20px] max-sm:border-2 max-sm:bg-white max-sm:shadow-[0_4px_0_0_var(--color-lip)]",
                  columnsClass,
                  inView ? "opacity-100" : "sc-reveal-hidden",
                )}
                style={{
                  "--row-wash": tint(pillar.softColor, 26),
                  transitionDelay: inView ? `${70 + index * 55}ms` : "0ms",
                }}
              >
                <div className="border-ground flex items-center gap-3 border-b-2 px-4 py-3.5 sm:border-0 sm:px-0 sm:pt-[clamp(14px,1.8vw,19px)] sm:pr-[clamp(12px,2vw,24px)] sm:pb-[clamp(14px,1.8vw,19px)]">
                  <ChapterKey id={kind} />
                  <span className="text-ink text-[15px] leading-[1.3] font-semibold tracking-[-0.01em] sm:text-[clamp(13px,1.5vw,15px)]">
                    {row.label}
                  </span>
                </div>

                <div
                  className={cn(
                    laneCellClass,
                    "text-[14.5px] leading-[1.45] text-[#8a93a8] sm:border-x sm:bg-[#f3f5fa] sm:text-[clamp(13px,1.5vw,15px)]",
                    isFirst &&
                      "sm:rounded-t-[20px] sm:border-t sm:shadow-[inset_0_5px_8px_-5px_rgba(15,35,61,0.34)]",
                    isLast && "sm:rounded-b-[20px] sm:border-b",
                    !isFirst && "sm:border-t",
                  )}
                  style={{
                    borderColor: GROOVE_EDGE,
                    ...(isFirst ? null : { borderTopColor: GROOVE_RULE }),
                  }}
                >
                  <span className={laneNameClass}>
                    {t.table.headers.legacy}
                  </span>
                  <span className="flex items-start gap-2.5 sm:items-center">
                    <span
                      className="mt-[7px] h-[2px] w-3 shrink-0 rounded-full bg-[#c6ccdb] sm:mt-0"
                      aria-hidden
                    />
                    {row.legacy}
                  </span>
                </div>

                {/* Negative margin on first/last rows lets the board overrun the groove's top/bottom edge on sm+. */}
                <div
                  className={cn(
                    laneCellClass,
                    "text-ink bg-[#f1f7ff] text-[14.5px] leading-[1.45] font-medium transition-colors duration-200 group-hover:bg-(--row-wash) sm:border-x-2 sm:bg-white sm:text-[clamp(13px,1.5vw,15px)]",
                    isFirst &&
                      "sm:-mt-3 sm:rounded-t-[22px] sm:border-t-2 sm:pt-[calc(clamp(14px,1.8vw,19px)_+_12px)]",
                    isLast &&
                      "sm:-mb-3 sm:rounded-b-[22px] sm:border-b-2 sm:pb-[calc(clamp(14px,1.8vw,19px)_+_12px)] sm:shadow-[0_5px_0_0_#a9ccff]",
                    !isFirst && "sm:border-t",
                  )}
                  style={{
                    borderColor: BOARD_EDGE,
                    ...(isFirst ? null : { borderTopColor: BOARD_RULE }),
                  }}
                >
                  <span className={laneNameClass}>
                    {t.table.headers.scibly}
                  </span>
                  <span className="flex items-start gap-2.5 sm:items-center">
                    <span className={boardKeyClass} aria-hidden>
                      <SciblyMark
                        size={13}
                        className="rounded-[3px] sm:hidden"
                      />
                      <span className="sm:hidden">
                        {t.table.headers.scibly}
                      </span>
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {row.scibly}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </MarketingSection>
  );
}

function ChapterKey({ id }: { id: PillarId }) {
  const { softColor, lipColor, accentColor } = PILLARS[id];
  const Icon = CHAPTER_ICONS[id];

  return (
    <span
      className="ease-press inline-flex size-[30px] shrink-0 items-center justify-center rounded-[9px] transition-transform duration-150 group-hover:-translate-y-[2px]"
      style={{
        backgroundColor: softColor,
        boxShadow: lipShadow(lipColor, 2),
        color: accentColor,
      }}
      aria-hidden
    >
      <Icon size={16} />
    </span>
  );
}
