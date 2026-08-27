import { GraduationCap } from "lucide-react";

import { tint } from "@/app/[lang]/components/marketing-tokens";

import { type CourseCopy } from "../../i18n/onboarding-offboarding.types";
import { MockQuizCard } from "../mock/mock-quiz-card";
import { enter, MUTED } from "../mock/mock-theme";
import { MockWindow } from "../mock/mock-window";
import { FlowMockBar } from "./flow-mock-bar";
import { FLOW_TONE } from "./onboarding-flow-tone";

export function CourseMock({ t }: { t: CourseCopy }) {
  return (
    <MockWindow>
      <FlowMockBar
        icon={<GraduationCap size={13} strokeWidth={2.6} />}
        title={t.lessonTitle}
        chip={t.lessonEyebrow}
      />
      <div className="flex flex-col gap-2 px-3.5 py-3">
        <div
          data-bento-anim
          className="flex flex-col gap-1 rounded-[8px] border-l-[3px] py-1.5 pr-2 pl-2.5"
          style={{
            borderColor: FLOW_TONE.accentColor,
            backgroundColor: tint(FLOW_TONE.softColor, 30),
            ...enter("sc-rise", 620),
          }}
        >
          <span
            className="text-[9px] font-bold tracking-wide uppercase"
            style={{ color: FLOW_TONE.accentColor }}
          >
            {t.whyLabel}
          </span>
          <p
            className="m-0 text-[11.5px] leading-[1.45]"
            style={{ color: MUTED }}
          >
            {t.whyText}
          </p>
        </div>

        <MockQuizCard
          data-bento-anim
          tone={FLOW_TONE}
          question={t.quizQuestion}
          wrongOption={t.quizOptionWrong}
          rightOption={t.quizOptionRight}
          truncateOptions
          style={enter("sc-catch", 760)}
        />
      </div>
    </MockWindow>
  );
}
