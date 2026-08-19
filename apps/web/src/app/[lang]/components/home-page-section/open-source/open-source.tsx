import { routes } from "@scibly/routes";
import {
  actionClass,
  primaryActionClass,
  secondaryActionClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { ArrowUpRight, Github, Server } from "lucide-react";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/app/[lang]/components/marketing-section-content";
import {
  lipShadow,
  PILLARS,
  tint,
} from "@/app/[lang]/components/marketing-tokens";

import { type OpenSourceDictionary } from "./i18n/open-source.types";
import { OpenSourceAtmosphere } from "./open-source-atmosphere";
import { MONO_FONT, SELF_HOSTING_GUIDE_HREF } from "./open-source-facts";
import { SelfHostTerminal } from "./self-host-terminal";

export function OpenSourceSection({ t }: { t: OpenSourceDictionary }) {
  return (
    <MarketingSection
      id="open-source"
      aria-labelledby="open-source-heading"
      atmosphere={<OpenSourceAtmosphere />}
    >
      <MarketingSectionHeader
        titleId="open-source-heading"
        eyebrow={
          <span className="inline-flex flex-wrap items-center gap-2.5">
            {t.eyebrow}
            <LicensePill>{t.licenseLabel}</LicensePill>
          </span>
        }
        title={t.title}
        description={t.subtitle}
      />

      <div className="mt-[clamp(26px,4vh,38px)] flex flex-wrap items-center gap-2.5">
        <a
          href={routes.external.github.repo}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(actionClass, primaryActionClass, "group")}
        >
          <Github size={15} aria-hidden />
          {t.actions.repo}
          <ArrowUpRight
            size={14}
            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </a>

        <a
          href={SELF_HOSTING_GUIDE_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(actionClass, secondaryActionClass)}
        >
          <Server size={15} aria-hidden />
          {t.actions.selfHost}
        </a>
      </div>

      <div className="mt-[clamp(30px,4.5vh,48px)]">
        <SelfHostTerminal t={t} />
      </div>
    </MarketingSection>
  );
}

function LicensePill({ children }: { children: React.ReactNode }) {
  const tone = PILLARS.learner;

  return (
    <span
      className="inline-flex items-center rounded-[8px] border px-2 py-[5px] text-[10.5px] leading-none font-semibold tracking-[0.01em] whitespace-nowrap"
      style={{
        fontFamily: MONO_FONT,
        backgroundColor: tint(tone.softColor, 34),
        borderColor: tint(tone.softColor, 78),
        boxShadow: lipShadow(tint(tone.lipColor, 62), 2),
        color: tone.accentColor,
      }}
    >
      {children}
    </span>
  );
}
