import { type ReactNode } from "react";

import { HeroShell } from "../../hero-shell/hero-shell";
import { type HeroDictionary } from "./i18n/hero.types";

interface HeroProps {
  t: HeroDictionary;
  children?: ReactNode;
}

export function Hero({ t, children }: HeroProps) {
  return (
    <HeroShell
      alt={t.productAlt}
      openSource={t.openSource}
      title={
        <>
          {t.title}
          <span className="font-serif-accent font-normal tracking-[-0.01em] italic">
            {t.titleHighlight}
          </span>
          {t.titleSuffix}
        </>
      }
      subtitle={t.subtitle}
    >
      {children !== undefined ? (
        <div className="relative mt-[clamp(24px,4.4vh,44px)] w-full max-w-[592px] text-left">
          {children}
        </div>
      ) : null}
    </HeroShell>
  );
}
