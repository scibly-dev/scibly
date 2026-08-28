import { type ReactNode } from "react";

import {
  keyStyle,
  panelKey,
  type Pillar,
} from "@/app/[lang]/components/marketing-tokens";

import { enter, MUTED } from "../mock/mock-theme";

export function KnowledgeSourceCard({
  tone,
  icon,
  title,
  description,
  canvas,
  delayMs,
}: {
  tone: Pillar;
  icon: ReactNode;
  title: string;
  description: string;
  canvas: ReactNode;
  delayMs: number;
}) {
  return (
    <div
      className="flex flex-col gap-4 rounded-[20px] border-2 p-3 pb-5"
      style={keyStyle(panelKey(tone))}
    >
      {/* Only the illustration animates in, so the title and description stay readable if the observer never fires. */}
      <div data-bento-anim style={enter("sc-rise", delayMs)}>
        {canvas}
      </div>
      <div className="flex flex-col gap-1.5 px-1">
        <div className="flex items-center gap-2">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-[8px]"
            style={{
              backgroundColor: tone.softColor,
              color: tone.accentColor,
            }}
            aria-hidden
          >
            {icon}
          </span>
          <h3 className="text-ink m-0 text-[17px] font-bold tracking-[-0.01em]">
            {title}
          </h3>
        </div>
        <p className="m-0 text-[14px] leading-[1.55]" style={{ color: MUTED }}>
          {description}
        </p>
      </div>
    </div>
  );
}
