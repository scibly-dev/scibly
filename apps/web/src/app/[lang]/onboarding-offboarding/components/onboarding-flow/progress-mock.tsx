import { ChartNoAxesColumn } from "lucide-react";

import { CORRECT_KEY } from "@/app/[lang]/components/marketing-tokens";

import { type ProgressCopy } from "../../i18n/onboarding-offboarding.types";
import { enter, HAIRLINE, MUTED } from "../mock/mock-theme";
import { MockWindow } from "../mock/mock-window";
import { FlowMockBar } from "./flow-mock-bar";
import { FLOW_TONE } from "./onboarding-flow-tone";

export function ProgressMock({ t }: { t: ProgressCopy }) {
  return (
    <MockWindow>
      <FlowMockBar
        icon={<ChartNoAxesColumn size={13} strokeWidth={2.6} />}
        title={t.windowTitle}
        chip={t.assignedLabel}
      />
      <ul className="m-0 flex list-none flex-col p-0">
        {t.people.map((person, index) => {
          const done = person.progress >= 100;
          return (
            <li
              key={person.name}
              data-bento-anim
              className="flex items-center gap-2.5 px-3.5 py-2.5"
              style={enter("sc-rise", 620 + index * 120)}
            >
              <span
                className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: FLOW_TONE.softColor,
                  color: FLOW_TONE.accentColor,
                }}
              >
                {person.initials}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-ink truncate text-[12px] font-bold">
                    {person.name}
                  </span>
                  <span
                    className="shrink-0 text-[10.5px] font-semibold whitespace-nowrap"
                    style={{ color: done ? CORRECT_KEY.ink : MUTED }}
                  >
                    {person.status}
                  </span>
                </div>
                <span
                  className="block h-1.5 overflow-hidden rounded-full"
                  style={{ backgroundColor: HAIRLINE }}
                >
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${person.progress}%`,
                      backgroundColor: done ? CORRECT_KEY.edge : "#0066ff",
                    }}
                  />
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </MockWindow>
  );
}
