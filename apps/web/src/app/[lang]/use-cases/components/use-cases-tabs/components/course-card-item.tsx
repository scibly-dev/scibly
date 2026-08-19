import type { Locale } from "@scibly/i18n/constants";
import type { Pillar } from "@/app/[lang]/components/marketing-tokens";
import type { CourseCard, CourseFrequency } from "../../../overview-data";

import { cardClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { PILLARS } from "@/app/[lang]/components/marketing-tokens";

const FREQUENCY_TONES = {
  mandatory: PILLARS.analytics,
  oneTime: PILLARS.import,
  recurring: PILLARS.learner,

  onDemand: {
    softColor: "var(--color-lip)",
    lipColor: "#e0e6f2",
    accentColor: "var(--color-ink-muted)",
  },
} satisfies Record<CourseFrequency, Pillar>;

interface CourseCardItemProps {
  card: CourseCard;
  locale: Locale;
  slugLabel: string;
  frequencyLabels: Record<CourseFrequency, string>;
}

export function CourseCardItem({
  card,
  locale,
  slugLabel,
  frequencyLabels,
}: CourseCardItemProps) {
  const tone = FREQUENCY_TONES[card.frequency];

  return (
    <div
      className={cn(
        cardClass,
        "hover:border-edge flex flex-col p-5 transition-colors duration-150",
      )}
    >
      <span
        className="mb-4 inline-flex items-center gap-1.5 self-start rounded-full px-2.5 py-[5px] text-[11px] leading-none font-semibold shadow-[0_2px_0_0_var(--freq-lip)]"
        style={{
          backgroundColor: tone.softColor,
          color: tone.accentColor,
          "--freq-lip": tone.lipColor,
        }}
      >
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: tone.accentColor }}
          aria-hidden
        />
        {frequencyLabels[card.frequency]}
      </span>

      <div className="text-ink mb-2 text-[16.5px] leading-[1.3] font-semibold tracking-[-0.018em]">
        {card.name}
      </div>
      <div className="text-ink-soft mb-5 flex-1 text-[14px] leading-[1.6] text-pretty">
        {card.description}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {card.roles.map((role: string) => (
            <span
              key={role}
              className="bg-ground-soft text-ink-muted rounded-full px-2.5 py-1 text-[11px] font-medium"
            >
              {role}
            </span>
          ))}
        </div>
        {card.slug && (
          <Link
            href={`/${locale}/use-cases/${card.slug}`}
            className="text-link flex shrink-0 items-center gap-1 text-[12.5px] font-semibold no-underline transition-colors hover:text-[#0066FF]"
          >
            {slugLabel}
            <ArrowRight size={12} strokeWidth={2.6} aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}
