import { cn } from "@scibly/ui/utils";
import { type ReactNode } from "react";

import { tint, washStyle } from "@/app/[lang]/components/marketing-tokens";

import { MockGroundFade } from "../mock/mock-ground-fade";
import { dottedGround } from "../mock/mock-theme";
import { FLOW_TONE } from "./onboarding-flow-tone";

export function FlowWell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ground = tint(FLOW_TONE.softColor, 38);
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[24px] border px-[clamp(18px,3vw,38px)] pt-[clamp(22px,3.5vw,40px)] pb-0",
        className,
      )}
      style={{ ...washStyle(FLOW_TONE), ...dottedGround(FLOW_TONE) }}
      aria-hidden
    >
      {children}
      <MockGroundFade ground={ground} className="h-14" />
    </div>
  );
}
