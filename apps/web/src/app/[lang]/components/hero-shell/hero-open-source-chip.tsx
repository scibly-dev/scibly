import { chipClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { ArrowDown, Github } from "lucide-react";

import { PILLARS, tint } from "@/app/[lang]/components/marketing-tokens";

import { type HeroDictionary } from "../home-page-section/hero/i18n/hero.types";

export function HeroOpenSourceChip({ t }: { t: HeroDictionary["openSource"] }) {
  return (
    <a
      href="#open-source"
      className={cn(
        chipClass,
        // Custom properties, not an inline `boxShadow`: that would outrank the press state's `shadow-none`.
        "group inline-flex items-center gap-2 border-(--os-edge) bg-(--os-face) text-(--os-ink) no-underline shadow-[0_3px_0_0_var(--os-lip)] hover:bg-(--os-face-hover)",
      )}
      style={{
        "--os-face": tint(PILLARS.learner.softColor, 26),
        "--os-face-hover": tint(PILLARS.learner.softColor, 44),
        "--os-edge": tint(PILLARS.learner.softColor, 82),
        "--os-lip": tint(PILLARS.learner.lipColor, 58),
        "--os-ink": PILLARS.learner.accentColor,
      }}
    >
      <Github size={14} strokeWidth={2} aria-hidden />
      {t.label}
      <span className="h-3.5 w-px bg-current opacity-25" aria-hidden />
      <span className="font-mono text-[11.5px] tracking-[0.01em]">
        {t.license}
      </span>
      <ArrowDown
        size={13}
        className="opacity-55 transition-transform group-hover:translate-y-0.5"
        aria-hidden
      />
    </a>
  );
}
