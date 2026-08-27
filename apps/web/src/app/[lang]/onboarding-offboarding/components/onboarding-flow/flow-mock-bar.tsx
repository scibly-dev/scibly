import { type ReactNode } from "react";

import { MockWindowBar } from "../mock/mock-window-bar";
import { FLOW_TONE } from "./onboarding-flow-tone";

export function FlowMockBar({
  icon,
  title,
  chip,
}: {
  icon: ReactNode;
  title: string;
  chip?: string;
}) {
  return (
    <MockWindowBar>
      <span style={{ color: FLOW_TONE.accentColor }}>{icon}</span>
      <span className="truncate">{title}</span>
      {chip ? (
        <span
          className="ml-auto shrink-0 rounded-[4px] px-1.5 py-px text-[9.5px] font-bold whitespace-nowrap"
          style={{
            backgroundColor: FLOW_TONE.softColor,
            color: FLOW_TONE.accentColor,
          }}
        >
          {chip}
        </span>
      ) : null}
    </MockWindowBar>
  );
}
