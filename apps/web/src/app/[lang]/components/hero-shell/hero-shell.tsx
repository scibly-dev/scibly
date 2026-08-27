import { type ReactNode } from "react";

import { type HeroDictionary } from "../home-page-section/hero/i18n/hero.types";
import { HeroGlassFrame } from "./hero-glass-frame";
import { HeroOpenSourceChip } from "./hero-open-source-chip";

const CONTENT_INSET =
  "md:top-[calc(clamp(88px,11.5vh,126px)+14px)] md:right-[calc(clamp(18px,5vw,112px)+14px)] md:bottom-[calc(clamp(28px,5.5vh,76px)+14px)] md:left-[calc(clamp(18px,5vw,112px)+14px)]";

// German compounds need the wider `md` measure to keep the headline off a fourth line.
const TITLE_CLASS =
  "m-0 max-w-[19ch] text-[clamp(32px,min(6.6vw,9vh),68px)] leading-[1.1] font-medium tracking-[-0.026em] text-balance text-[#131c46] [text-shadow:0_2px_24px_rgba(255,255,255,0.6)] md:max-w-[21ch]";

const SUBTITLE_CLASS =
  "mt-[clamp(16px,2.8vh,26px)] max-w-[440px] text-[clamp(15px,4vw,16.5px)] leading-[1.5] text-pretty text-[#2b3a58] [text-shadow:0_2px_14px_rgba(255,255,255,0.65)]";

export function HeroShell({
  alt,
  openSource,
  title,
  subtitle,
  children,
}: {
  alt: string;
  openSource: HeroDictionary["openSource"];
  title: ReactNode;
  subtitle: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="font-display relative z-10 flex min-h-svh flex-col bg-[linear-gradient(180deg,#dbe7f4_0%,#dbe7f4_60%,#fdfdfb_100%)] md:bg-white md:bg-none md:pb-[clamp(20px,3vh,44px)]">
      <div
        className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(rgba(15,23,42,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.055)_1px,transparent_1px)] [mask-image:linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.85)_16%,rgba(0,0,0,0.85)_58%,rgba(0,0,0,0)_88%)] bg-[length:68px_68px] bg-[position:center_top] md:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute hidden h-[120px] rounded-[50%] bg-[radial-gradient(50%_50%_at_50%_50%,rgba(15,23,42,0.07)_0%,rgba(15,23,42,0)_74%)] blur-[38px] md:right-[calc(clamp(18px,5vw,112px)+26px)] md:bottom-[calc(clamp(28px,5.5vh,76px)-86px)] md:left-[calc(clamp(18px,5vw,112px)+26px)] md:block"
        aria-hidden
      />

      <HeroGlassFrame alt={alt} />

      <div
        className={`relative z-[2] flex min-h-0 flex-1 flex-col items-center justify-center px-5 pt-24 pb-9 text-center md:absolute md:px-[clamp(40px,6vw,96px)] md:py-[clamp(24px,4vh,60px)] ${CONTENT_INSET}`}
      >
        <div className="mb-[clamp(16px,2.6vh,26px)]">
          <HeroOpenSourceChip t={openSource} />
        </div>

        <h1 className={TITLE_CLASS}>{title}</h1>

        <p className={SUBTITLE_CLASS}>{subtitle}</p>

        {children}
      </div>
    </section>
  );
}
