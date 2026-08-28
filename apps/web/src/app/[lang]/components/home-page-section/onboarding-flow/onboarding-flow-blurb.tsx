import { chosenKey, keyStyle } from "@/app/[lang]/components/marketing-tokens";

import { HAIRLINE, MUTED } from "../mock/mock-theme";
import { FLOW_TONE } from "./onboarding-flow-tone";

export function OnboardingFlowBlurb({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex flex-col gap-2.5 border-t pt-[clamp(16px,2.2vh,22px)]"
      style={{ borderColor: HAIRLINE }}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border-2 text-[13px] font-bold tabular-nums"
          style={keyStyle(chosenKey(FLOW_TONE), 3)}
        >
          {String(index).padStart(2, "0")}
        </span>
        <h3 className="text-ink m-0 text-[clamp(18px,1.5vw,21px)] font-bold tracking-[-0.015em]">
          {title}
        </h3>
      </div>
      <p className="m-0 text-[14.5px] leading-[1.55]" style={{ color: MUTED }}>
        {description}
      </p>
    </div>
  );
}
