import type { Locale } from "@scibly/i18n/constants";
import type { SkillCategory, SkillEntry, SkillsPageContent } from "../data";

import {
  actionClass,
  cardClass,
  cardInteractiveClass,
  secondaryActionClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { ArrowUpRight, Github } from "lucide-react";

import { PILLARS } from "@/app/[lang]/components/marketing-tokens";

import { MarketingSection } from "../../components/marketing-section-content";

const GITHUB_BASE = "https://github.com/scibly-dev/skills/blob/main/skills";

const CATEGORY_TONES = {
  analysis: PILLARS.byoai,
  design: PILLARS.import,
  content: PILLARS.learner,
  production: PILLARS.analytics,
} satisfies Record<SkillCategory, (typeof PILLARS)[keyof typeof PILLARS]>;

interface AiSkillsGridProps {
  locale: Locale;
  skills: SkillEntry[];
  content: SkillsPageContent;
}

export function AiSkillsGrid({ locale, skills, content }: AiSkillsGridProps) {
  return (
    <MarketingSection frameClassName="pt-0">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((skill) => {
          const loc = skill[locale];
          const tone = CATEGORY_TONES[skill.category];

          return (
            <a
              key={skill.id}
              href={`${GITHUB_BASE}/${skill.id}/SKILL.md`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                cardClass,
                cardInteractiveClass,
                "group flex flex-col p-5 no-underline",
              )}
            >
              <div className="mb-4 flex items-center justify-between gap-2">
                <span className="text-ink font-mono text-[12px] font-semibold">
                  {skill.displayName}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-[5px] text-[11px] leading-none font-semibold shadow-[0_2px_0_0_var(--pill-lip)]"
                    style={{
                      backgroundColor: tone.softColor,
                      color: tone.accentColor,
                      "--pill-lip": tone.lipColor,
                    }}
                  >
                    {content.categories[skill.category]}
                  </span>
                  <ArrowUpRight
                    size={14}
                    strokeWidth={2.5}
                    className="text-ink-faint shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    aria-hidden
                  />
                </div>
              </div>

              <div className="text-ink mb-2 text-[15.5px] leading-[1.3] font-semibold tracking-[-0.014em]">
                {loc.tagline}
              </div>
              <div className="text-ink-soft mb-5 flex-1 text-[13.5px] leading-[1.6] text-pretty">
                {loc.description}
              </div>

              <div className="bg-ground-soft rounded-[12px] px-3.5 py-3">
                <div className="text-ink-faint mb-1 text-[11.5px] leading-none font-semibold">
                  {content.cardWhenLabel}
                </div>
                <div className="text-ink-muted text-[12.5px] leading-[1.6]">
                  {loc.when}
                </div>
              </div>
            </a>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <a
          href="https://github.com/scibly-dev/skills"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(actionClass, secondaryActionClass)}
        >
          <Github size={15} aria-hidden />
          {content.githubLabel}
        </a>
      </div>
    </MarketingSection>
  );
}
