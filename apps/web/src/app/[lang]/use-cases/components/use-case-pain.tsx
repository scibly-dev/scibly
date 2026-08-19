import {
  cardClass,
  eyebrowClass,
  titleClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";

import { MarketingSection } from "../../components/marketing-section-content";

interface UseCasePainProps {
  eyebrow: string;
  title: string;
  items: Array<{ title: string; description: string }>;
}

export function UseCasePain({ eyebrow, title, items }: UseCasePainProps) {
  return (
    <MarketingSection top="flush">
      <div className="mx-auto mb-11 flex max-w-[720px] flex-col items-center text-center">
        <p className={eyebrowClass}>{eyebrow}</p>
        <h2 className={cn(titleClass, "mt-4 text-[clamp(30px,3.2vw,44px)]")}>
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((item, i) => (
          <div key={i} className={cn(cardClass, "p-6")}>
            <span className="text-ink-faint mb-5 flex size-9 items-center justify-center rounded-[11px] bg-[#f2f4fb] text-[14px] font-bold shadow-[0_2px_0_0_#e5e9f4]">
              {i + 1}
            </span>
            <h3 className="text-ink m-0 mb-2 text-[16.5px] leading-[1.35] font-semibold tracking-[-0.018em]">
              {item.title}
            </h3>
            <p className="text-ink-soft m-0 text-[14.5px] leading-[1.65] text-pretty">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </MarketingSection>
  );
}
