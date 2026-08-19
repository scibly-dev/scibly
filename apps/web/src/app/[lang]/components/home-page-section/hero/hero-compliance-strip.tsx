"use client";

import { useState } from "react";

import { MarketingSectionFrame } from "@/app/[lang]/components/marketing-section-frame";

import {
  SECURITY_CLAIMS,
  toSecurityClaimId,
} from "../compliance/security-claims";
import { type HeroDictionary } from "./i18n/hero.types";

const tileClass =
  "inline-flex cursor-pointer items-center gap-[9px] rounded-[14px] border-0 bg-(--tile-face) px-5 py-3 text-[14.5px] font-bold tracking-[0.002em] whitespace-nowrap text-(--tile-ink) select-none shadow-[0_4px_0_0_var(--tile-lip),0_6px_12px_-6px_rgba(15,23,42,0.28),inset_0_1px_0_var(--tile-gloss)] transition-[translate,box-shadow,background-color,color] duration-[110ms] ease-press active:translate-y-[4px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 focus-visible:outline-none";

export function HeroComplianceStrip({
  t,
}: {
  t: Pick<HeroDictionary, "complianceBadges">;
}) {
  const badges = t.complianceBadges.flatMap((badge) => {
    const kind = toSecurityClaimId(badge.kind);
    return kind ? [{ ...badge, kind }] : [];
  });
  const [selectedKind, setSelectedKind] = useState(() => badges[0]?.kind);
  const selected = badges.find((b) => b.kind === selectedKind) ?? badges[0];

  return (
    <section className="font-display relative z-10 bg-white">
      <MarketingSectionFrame className="flex flex-col items-center gap-4 px-5 pt-[26px] md:gap-[18px] md:px-[clamp(20px,5vw,40px)] md:pt-[clamp(14px,2.6vh,30px)]">
        <ul
          className="m-0 flex list-none flex-wrap items-center justify-center gap-3.5 p-0"
          data-hero-compliance
        >
          {badges.map((badge) => {
            const claim = SECURITY_CLAIMS[badge.kind];
            const isSelected = badge.kind === selected?.kind;
            const Icon = claim.icon;

            return (
              <li key={badge.kind}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  aria-describedby="hero-compliance-detail"
                  onClick={() => setSelectedKind(badge.kind)}
                  className={tileClass}
                  style={{
                    "--tile-face": isSelected
                      ? claim.pressedFace
                      : claim.pillar.softColor,
                    "--tile-lip": isSelected
                      ? claim.pressedLip
                      : claim.pillar.lipColor,
                    "--tile-ink": isSelected
                      ? "#ffffff"
                      : claim.pillar.accentColor,
                    "--tile-gloss": isSelected
                      ? "rgba(255,255,255,0.28)"
                      : "rgba(255,255,255,0.7)",
                  }}
                >
                  <Icon size={15} strokeWidth={2} aria-hidden />
                  {badge.label}
                </button>
              </li>
            );
          })}
        </ul>

        <p
          id="hero-compliance-detail"
          aria-live="polite"
          className="text-ink-muted m-0 min-h-[22px] max-w-[60ch] text-center text-[14.5px] leading-[1.5] font-medium text-pretty"
        >
          {selected?.detail}
        </p>
      </MarketingSectionFrame>
    </section>
  );
}
