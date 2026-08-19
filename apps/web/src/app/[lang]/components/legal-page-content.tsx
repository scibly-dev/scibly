import { eyebrowClass, titleClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { type ReactNode } from "react";

import { MarketingGridField } from "./marketing-grid-field";
import { marketingPageSectionClass } from "./marketing-section-content";
import { MarketingSectionFrame } from "./marketing-section-frame";

export const legalHeadingClass =
  "text-ink mb-3 text-[19px] font-semibold tracking-[-0.018em]";

export const legalSubheadingClass =
  "text-ink mb-1.5 text-[15.5px] font-semibold";

// Rendered from `data-text` by CSS (not as text content) so scrapers reading the markup come away empty-handed; `aria-label` keeps it available to screen readers.
export function LegalContactValue({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span
      className={cn("no-copy-address", className)}
      data-text={text}
      aria-label={text}
    />
  );
}

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className={cn(marketingPageSectionClass, "min-h-dvh")}>
      <MarketingGridField />

      <MarketingSectionFrame className="relative z-10 max-w-[840px] px-5 pt-[clamp(104px,15vh,152px)] pb-[clamp(64px,10vh,130px)] md:px-[clamp(20px,5vw,40px)]">
        <p className={eyebrowClass}>Rechtliches</p>
        <h1
          className={cn(titleClass, "mt-4 mb-9 text-[clamp(30px,3.2vw,44px)]")}
        >
          {title}
        </h1>

        <section className="text-ink-muted space-y-9 font-sans text-[15.5px] leading-[1.7]">
          {children}
        </section>
      </MarketingSectionFrame>
    </main>
  );
}
