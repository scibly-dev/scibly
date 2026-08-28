"use client";

import { cn } from "@scibly/ui/utils";
import { UserMinus } from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/app/[lang]/components/marketing-section-content";
import { PILLARS, PRODUCT_INK } from "@/app/[lang]/components/marketing-tokens";
import { useInViewOnce } from "@/components/in-view-reveal";

import { MUTED } from "../mock/mock-theme";
import { type ProblemNumbersDictionary } from "./i18n/problem-numbers.types";
import { SlidingNumber } from "./sliding-number";

const TONE = PILLARS.byoai;

export function ProblemNumbersSection({ t }: { t: ProblemNumbersDictionary }) {
  const { ref, inView } = useInViewOnce<HTMLElement>(0.25);
  // The section is in view long before the stats are, so the counters get their own later threshold.
  const { ref: statsRef, inView: statsInView } =
    useInViewOnce<HTMLDListElement>(0.6, "0px 0px -12% 0px");

  return (
    <MarketingSection
      ref={ref}
      id="problem-numbers"
      aria-labelledby="problem-numbers-heading"
      className={cn("sc-bento", inView && "sc-bento-ready")}
      atmosphere={null}
    >
      <MarketingSectionHeader
        titleId="problem-numbers-heading"
        eyebrow={t.eyebrow}
        title={t.title}
      />

      <div className="mt-[clamp(32px,7vh,80px)] grid gap-[clamp(32px,5vw,72px)] md:grid-cols-2">
        {/* Mobile drops the hanging indent so the body shares the stats' left edge. */}
        <div className="grid max-w-[52ch] grid-cols-[auto_1fr] content-start items-start gap-x-4 gap-y-3 sm:gap-y-2.5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px]"
            style={{
              backgroundColor: TONE.softColor,
              color: TONE.accentColor,
            }}
            aria-hidden
          >
            <UserMinus size={18} strokeWidth={2.4} />
          </span>
          <h3 className="text-ink m-0 self-center text-[21px] font-bold tracking-[-0.015em]">
            {t.problemLabel}
          </h3>
          <p
            className="col-span-2 m-0 text-[15px] leading-[1.6] sm:col-span-1 sm:col-start-2"
            style={{ color: MUTED }}
          >
            {t.problemBody}
          </p>
        </div>

        <dl
          ref={statsRef}
          className="m-0 grid grid-cols-2 gap-x-5 gap-y-5 sm:gap-x-[clamp(24px,4vw,48px)] sm:gap-y-[clamp(28px,4vh,44px)]"
        >
          {t.stats.map((stat) => (
            <div
              key={stat.value}
              className="border-hairline flex flex-col gap-1.5 border-t pt-3.5 sm:gap-2 sm:border-0 sm:pt-0"
            >
              <dt style={{ color: PRODUCT_INK }}>
                <SlidingNumber
                  value={stat.value}
                  active={statsInView}
                  className="text-[22px] leading-none font-bold tracking-[-0.03em] sm:text-[clamp(30px,3.4vw,40px)]"
                />
              </dt>
              <dd
                className="m-0 max-w-[30ch] text-[13px] leading-[1.45] sm:text-[13.5px] sm:leading-[1.5]"
                style={{ color: MUTED }}
              >
                {stat.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </MarketingSection>
  );
}
