import { Check, ListChecks } from "lucide-react";

import { CORRECT_KEY } from "@/app/[lang]/components/marketing-tokens";

import { type ChecklistCopy } from "../../i18n/onboarding-offboarding.types";
import { enter, FAINT, HAIRLINE, MUTED } from "../mock/mock-theme";
import { MockWindow } from "../mock/mock-window";
import { FlowMockBar } from "./flow-mock-bar";

function numberStepsAcrossGroups(groups: ChecklistCopy["groups"]) {
  let stepsBefore = 0;
  return groups.map((group) => {
    const items = group.items.map((item, index) => ({
      ...item,
      step: stepsBefore + index,
    }));
    stepsBefore += group.items.length;
    return { label: group.label, items };
  });
}

export function ChecklistMock({ t }: { t: ChecklistCopy }) {
  const groups = numberStepsAcrossGroups(t.groups);

  return (
    <MockWindow>
      <FlowMockBar
        icon={<ListChecks size={13} strokeWidth={2.6} />}
        title={t.windowTitle}
        chip={t.stepCount}
      />
      <div className="flex flex-col gap-2 px-3.5 py-3">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <span
              className="text-[9.5px] font-bold tracking-wide uppercase"
              style={{ color: FAINT }}
            >
              {group.label}
            </span>
            {group.items.map((item) => (
              <div
                key={item.label}
                data-bento-anim
                className="flex items-center gap-2"
                style={enter("sc-rise", 240 + item.step * 90)}
              >
                <span
                  className="flex size-3.5 shrink-0 items-center justify-center rounded-[4px] border-2"
                  style={
                    item.done
                      ? {
                          backgroundColor: CORRECT_KEY.edge,
                          borderColor: CORRECT_KEY.edge,
                          color: "#ffffff",
                        }
                      : { borderColor: "#c6cde6" }
                  }
                >
                  {item.done ? <Check size={8} strokeWidth={4} /> : null}
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-[11.5px] font-medium"
                  style={{
                    color: item.done ? FAINT : MUTED,
                    textDecorationLine: item.done ? "line-through" : "none",
                  }}
                >
                  {item.label}
                </span>
                <span
                  className="shrink-0 rounded-[4px] px-1.5 py-px text-[9.5px] font-semibold whitespace-nowrap"
                  style={{ backgroundColor: HAIRLINE, color: MUTED }}
                >
                  {item.meta}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </MockWindow>
  );
}
