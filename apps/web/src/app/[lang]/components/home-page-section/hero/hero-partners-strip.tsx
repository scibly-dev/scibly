import Image from "next/image";

import { MarketingSectionFrame } from "@/app/[lang]/components/marketing-section-frame";

import { type HeroDictionary } from "./i18n/hero.types";

// Heights are tuned by eye so the marks carry equal visual weight, not equal boxes.
const PARTNERS = [
  {
    name: "TU Darmstadt",
    src: "/logos/partners/tu-darmstadt.svg",
    width: 1024,
    height: 424,
    className: "h-[40px] md:h-[46px]",
  },
  {
    name: "hessian.AI",
    src: "/logos/partners/hessian-ai.svg",
    width: 308,
    height: 63,
    className: "h-[22px] md:h-[25px]",
  },
  {
    name: "Futury",
    src: "/logos/partners/futury.png",
    width: 640,
    height: 149,
    className: "h-[18px] md:h-[21px]",
  },
] as const;

const markClass =
  "opacity-65 grayscale transition-[opacity,filter] duration-200 hover:opacity-100 hover:grayscale-0";

export function HeroPartnersStrip({
  t,
}: {
  t: Pick<HeroDictionary, "partners">;
}) {
  return (
    <section className="font-display relative z-10 bg-white">
      <MarketingSectionFrame className="flex flex-col items-center gap-4 px-5 pt-[clamp(40px,6vh,64px)] md:px-[clamp(20px,5vw,40px)]">
        <p className="text-ink-muted m-0 text-[12.5px] font-semibold tracking-[0.08em] uppercase">
          {t.partners.label}
        </p>
        <ul className="m-0 flex list-none flex-wrap items-center justify-center gap-x-10 gap-y-5 p-0 md:gap-x-14">
          {PARTNERS.map((partner) => (
            <li key={partner.name} className="flex items-center">
              <Image
                src={partner.src}
                alt={partner.name}
                width={partner.width}
                height={partner.height}
                className={`w-auto ${partner.className} ${markClass}`}
              />
            </li>
          ))}
          {/* ponytail: no official EdTech Academy logo is published; swap in an <Image> once we have one. */}
          <li className="flex items-center">
            <span
              className={`text-[17px] leading-none font-bold tracking-[-0.01em] whitespace-nowrap text-[#131c46] md:text-[19px] ${markClass}`}
            >
              EdTech Academy
            </span>
          </li>
        </ul>
      </MarketingSectionFrame>
    </section>
  );
}
