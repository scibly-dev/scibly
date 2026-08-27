import { type ReactNode } from "react";

import { type Pillar, tint } from "@/app/[lang]/components/marketing-tokens";

import { MockGroundFade } from "../mock/mock-ground-fade";
import { dottedGround } from "../mock/mock-theme";

export function CardCanvas({
  tone,
  children,
}: {
  tone: Pillar;
  children: ReactNode;
}) {
  const ground = tint(tone.softColor, 42);
  return (
    <div
      className="relative h-[328px] overflow-hidden rounded-[14px]"
      style={{ backgroundColor: ground, ...dottedGround(tone) }}
      aria-hidden
    >
      {children}
      <MockGroundFade ground={ground} className="h-16" />
    </div>
  );
}
