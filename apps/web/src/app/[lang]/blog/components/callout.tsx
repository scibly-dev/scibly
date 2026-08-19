import type { IconProps } from "@scibly/ui/components/icon";

import Icon from "@scibly/ui/components/icon";
import React from "react";

import { PILLARS, tint } from "@/app/[lang]/components/marketing-tokens";

type CalloutType = "info" | "warning" | "tip" | "danger";

type CalloutTone = {
  soft: string;
  lip: string;
  accent: string;
  icon: IconProps["name"];
};

const CALLOUT_TONES = {
  info: {
    soft: PILLARS.import.softColor,
    lip: PILLARS.import.lipColor,
    accent: PILLARS.import.accentColor,
    icon: "Info",
  },
  warning: {
    soft: PILLARS.analytics.softColor,
    lip: PILLARS.analytics.lipColor,
    accent: PILLARS.analytics.accentColor,
    icon: "CircleAlert",
  },
  tip: {
    soft: PILLARS.channels.softColor,
    lip: PILLARS.channels.lipColor,
    accent: PILLARS.channels.accentColor,
    icon: "Lightbulb",
  },
  danger: {
    soft: "#ffd3cf",
    lip: "#ffaba2",
    accent: "#a3241a",
    icon: "CircleAlert",
  },
} satisfies Record<CalloutType, CalloutTone>;

interface CalloutProps {
  children: React.ReactNode;
  type?: CalloutType;
}

export function Callout({ children, type = "info" }: CalloutProps) {
  const tone = CALLOUT_TONES[type] ?? CALLOUT_TONES.info;

  return (
    <div
      className="my-7 flex items-start gap-3.5 rounded-[16px] border-2 p-4 shadow-[0_4px_0_0_var(--callout-lip)]"
      style={{
        backgroundColor: tint(tone.soft, 26),
        borderColor: tint(tone.soft, 76),
        "--callout-lip": tint(tone.lip, 45),
      }}
    >
      <span
        className="mt-px flex size-8 shrink-0 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: tone.soft, color: tone.accent }}
        aria-hidden
      >
        <Icon name={tone.icon} className="h-4 w-4" />
      </span>
      <div className="m-0 font-sans text-[15px] leading-[1.65] text-[#3c477a] [&>p]:m-0 [&>p]:text-inherit">
        {children}
      </div>
    </div>
  );
}
