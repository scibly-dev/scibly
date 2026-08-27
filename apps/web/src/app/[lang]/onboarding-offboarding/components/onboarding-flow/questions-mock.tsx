import { MessageCircleQuestion, Sparkles } from "lucide-react";

import {
  CORRECT_KEY,
  NOTICE_KEY,
  tint,
} from "@/app/[lang]/components/marketing-tokens";
import { SciblyMark } from "@/components/brand-logo";

import { type QuestionsCopy } from "../../i18n/onboarding-offboarding.types";
import { enter, HAIRLINE, MUTED } from "../mock/mock-theme";
import { MockWindow } from "../mock/mock-window";
import { FlowMockBar } from "./flow-mock-bar";
import { FLOW_TONE } from "./onboarding-flow-tone";

export function QuestionsMock({ t }: { t: QuestionsCopy }) {
  return (
    <MockWindow>
      <FlowMockBar
        icon={<MessageCircleQuestion size={13} strokeWidth={2.6} />}
        title={t.windowTitle}
      />
      <div className="flex flex-col gap-2 px-3.5 py-3">
        <div
          data-bento-anim
          className="flex items-start gap-2"
          style={enter("sc-rise", 240)}
        >
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
            style={{
              backgroundColor: FLOW_TONE.softColor,
              color: FLOW_TONE.accentColor,
            }}
          >
            {t.learnerInitials}
          </span>
          <p
            className="m-0 min-w-0 rounded-[10px] rounded-tl-[3px] px-2.5 py-1.5 text-[11.5px] leading-[1.45]"
            style={{ backgroundColor: HAIRLINE, color: MUTED }}
          >
            <span className="text-ink font-bold">{t.learnerName}</span>{" "}
            {t.question}
          </p>
        </div>

        <div
          data-bento-anim
          className="flex items-start gap-2"
          style={enter("sc-rise", 370)}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white ring-1 ring-[#dde2f0]">
            <SciblyMark size={13} alt="" />
          </span>
          <p
            className="m-0 min-w-0 rounded-[10px] rounded-tl-[3px] border px-2.5 py-1.5 text-[11.5px] leading-[1.45]"
            style={{ borderColor: HAIRLINE, color: MUTED }}
          >
            <span className="text-ink font-bold">{t.aiName}</span> {t.answer}
          </p>
        </div>

        <div
          data-bento-anim
          className="flex flex-col gap-1.5 rounded-[10px] border-2 border-dashed p-2.5"
          style={{
            borderColor: tint(FLOW_TONE.lipColor, 70),
            ...enter("sc-catch", 560),
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="shrink-0 rounded-[4px] px-1.5 py-px text-[9px] font-bold tracking-wide uppercase"
              style={{
                backgroundColor: NOTICE_KEY.face,
                color: NOTICE_KEY.ink,
              }}
            >
              {t.feedbackLabel}
            </span>
            <span
              className="min-w-0 truncate text-[11px]"
              style={{ color: MUTED }}
            >
              {t.feedbackText}
            </span>
          </div>
          <span
            className="inline-flex w-fit items-center gap-1 rounded-[4px] px-1.5 py-0.5 text-[9.5px] font-bold"
            style={{
              backgroundColor: CORRECT_KEY.face,
              color: CORRECT_KEY.ink,
            }}
          >
            <Sparkles size={10} strokeWidth={2.8} />
            {t.improvedLabel}
          </span>
        </div>
      </div>
    </MockWindow>
  );
}
