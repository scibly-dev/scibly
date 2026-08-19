import {
  cardClass,
  eyebrowClass,
  titleClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";
import { BarChart2, CheckCircle2, Zap } from "lucide-react";

import { PILLARS } from "@/app/[lang]/components/marketing-tokens";

import { MarketingSection } from "../../components/marketing-section-content";

const FEATURE_KEYS = [
  { icon: CheckCircle2, pillar: PILLARS.learner },
  { icon: Zap, pillar: PILLARS.import },
  { icon: BarChart2, pillar: PILLARS.analytics },
] as const;

interface UseCaseFeaturesProps {
  eyebrow: string;
  title: string;
  items: Array<{ title: string; description: string }>;
}

export function UseCaseFeatures({
  eyebrow,
  title,
  items,
}: UseCaseFeaturesProps) {
  return (
    <MarketingSection>
      <div className="mx-auto mb-11 flex max-w-[720px] flex-col items-center text-center">
        <p className={eyebrowClass}>{eyebrow}</p>
        <h2 className={cn(titleClass, "mt-4 text-[clamp(30px,3.2vw,44px)]")}>
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((item, i) => {
          const key = FEATURE_KEYS[i % FEATURE_KEYS.length];
          const pillar = key.pillar;

          return (
            <div key={i} className={cn(cardClass, "p-6")}>
              <span
                className="mb-5 flex size-10 items-center justify-center rounded-[12px] shadow-[0_3px_0_0_var(--key-lip)]"
                style={{
                  backgroundColor: pillar.softColor,
                  color: pillar.accentColor,
                  "--key-lip": pillar.lipColor,
                }}
                aria-hidden
              >
                <key.icon size={19} strokeWidth={2.4} />
              </span>
              <h3 className="text-ink m-0 mb-2 text-[16.5px] leading-[1.35] font-semibold tracking-[-0.018em]">
                {item.title}
              </h3>
              <p className="text-ink-soft m-0 text-[14.5px] leading-[1.65] text-pretty">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </MarketingSection>
  );
}
