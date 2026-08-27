"use client";

import { cn } from "@scibly/ui/utils";
import { UserMinus } from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/app/[lang]/components/marketing-section-content";
import { PILLARS, PRODUCT_INK } from "@/app/[lang]/components/marketing-tokens";
import { useInViewOnce } from "@/components/in-view-reveal";

import { type ProblemNumbersCopy } from "../../i18n/onboarding-offboarding.types";
import { MUTED } from "../mock/mock-theme";
import { SlidingNumber } from "./sliding-number";

const TONE = PILLARS.byoai;

export function ProblemNumbersSection({ t }: { t: ProblemNumbersCopy }) {
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

      <div className="mt-[clamp(48px,7vh,80px)] grid gap-[clamp(32px,5vw,72px)] md:grid-cols-2">
        <div className="flex max-w-[52ch] items-start gap-4">
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
          <div className="flex flex-col gap-2.5">
            <h3 className="text-ink m-0 text-[21px] font-bold tracking-[-0.015em]">
              {t.problemLabel}
            </h3>
            <p
              className="m-0 text-[15px] leading-[1.6]"
              style={{ color: MUTED }}
            >
              {t.problemBody}
            </p>
          </div>
        </div>

        <dl
          ref={statsRef}
          className="m-0 grid gap-x-[clamp(24px,4vw,48px)] gap-y-[clamp(28px,4vh,44px)] sm:grid-cols-2"
        >
          {t.stats.map((stat) => (
            <div key={stat.value} className="flex flex-col gap-2">
              <dt style={{ color: PRODUCT_INK }}>
                <SlidingNumber
                  value={stat.value}
                  active={statsInView}
                  className="text-[clamp(30px,3.4vw,40px)] leading-none font-bold tracking-[-0.03em]"
                />
              </dt>
              <dd
                className="m-0 max-w-[30ch] text-[13.5px] leading-[1.5]"
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
