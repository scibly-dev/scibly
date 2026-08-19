import {
  eyebrowClass,
  subtitleClass,
  titleClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { type ComponentPropsWithoutRef, type ReactNode, type Ref } from "react";

import { MarketingGridField } from "./marketing-grid-field";
import { MarketingSectionFrame } from "./marketing-section-frame";

export const marketingPageSectionClass =
  "font-display relative z-10 overflow-hidden bg-white";

// `overflow-hidden` would make the section a scroll container, which silently stops `position: sticky` descendants from sticking, so this only clips the horizontal axis.
export const marketingPageSectionStickyClass =
  "font-display relative z-10 overflow-x-clip bg-white";

// `page` clears the floating navbar, `subpage` a shorter header, `flush` follows a section that already ended in whitespace, and `section` is the home page's default rhythm.
export type MarketingSectionTop = "section" | "page" | "subpage" | "flush";

const SECTION_TOP = {
  section: "pt-[clamp(64px,10vh,130px)]",
  page: "pt-[clamp(112px,16vh,168px)]",
  subpage: "pt-[clamp(104px,15vh,152px)]",
  flush: "pt-[clamp(48px,7vh,80px)]",
} satisfies Record<MarketingSectionTop, string>;

const SECTION_FRAME =
  "relative z-10 px-5 pb-[clamp(64px,10vh,130px)] md:px-[clamp(20px,5vw,40px)]";

type MarketingSectionProps = Omit<
  ComponentPropsWithoutRef<"section">,
  "children"
> & {
  ref?: Ref<HTMLElement>;
  children: ReactNode;
  top?: MarketingSectionTop;

  sticky?: boolean;

  atmosphere?: ReactNode;
  frameClassName?: string;
};

export function MarketingSection({
  ref,
  children,
  top = "section",
  sticky = false,
  atmosphere,
  frameClassName,
  className,
  ...sectionProps
}: MarketingSectionProps) {
  return (
    <section
      ref={ref}
      className={cn(
        sticky ? marketingPageSectionStickyClass : marketingPageSectionClass,
        className,
      )}
      {...sectionProps}
    >
      {atmosphere === undefined ? <MarketingGridField /> : atmosphere}

      <MarketingSectionFrame
        className={cn(SECTION_FRAME, SECTION_TOP[top], frameClassName)}
      >
        {children}
      </MarketingSectionFrame>
    </section>
  );
}

type MarketingSectionHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  titleId?: string;
  description?: ReactNode;

  action?: ReactNode;

  layout?: "split" | "stacked";
  className?: string;
};

export function MarketingSectionHeader({
  eyebrow,
  title,
  titleId,
  description,
  action,
  layout = "split",
  className,
}: MarketingSectionHeaderProps) {
  const aside = description ?? action;
  const split = layout === "split" && Boolean(aside);

  return (
    <header
      className={cn(
        "flex flex-col gap-6",
        split &&
          "md:flex-row md:items-end md:justify-between md:gap-[clamp(30px,5vw,80px)]",
        className,
      )}
    >
      <div className="flex max-w-[660px] flex-col gap-3.5">
        {eyebrow ? <p className={eyebrowClass}>{eyebrow}</p> : null}
        <h2 id={titleId} className={titleClass}>
          {title}
        </h2>
      </div>

      {aside ? (
        <div
          className={cn(
            "flex flex-col items-start gap-6",
            split ? "shrink-0 md:max-w-[36ch]" : "max-w-[64ch]",
          )}
        >
          {description ? <p className={subtitleClass}>{description}</p> : null}
          {action}
        </div>
      ) : null}
    </header>
  );
}
