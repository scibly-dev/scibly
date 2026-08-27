"use client";

import { cn } from "@scibly/ui/utils";

import {
  MarketingSection,
  MarketingSectionHeader,
} from "@/app/[lang]/components/marketing-section-content";
import { useInViewOnce } from "@/components/in-view-reveal";

import { type OnboardingFlowCopy } from "../../i18n/onboarding-offboarding.types";
import { ChecklistMock } from "./checklist-mock";
import { CourseMock } from "./course-mock";
import { FlowWell } from "./flow-well";
import { OnboardingFlowBlurb } from "./onboarding-flow-blurb";
import { ProgressMock } from "./progress-mock";
import { QuestionsMock } from "./questions-mock";

export function OnboardingFlowSection({ t }: { t: OnboardingFlowCopy }) {
  const { ref, inView } = useInViewOnce<HTMLElement>(0.12);

  return (
    <MarketingSection
      ref={ref}
      id="onboarding-flow"
      aria-labelledby="onboarding-flow-heading"
      className={cn("sc-bento", inView && "sc-bento-ready")}
      atmosphere={null}
    >
      <MarketingSectionHeader
        titleId="onboarding-flow-heading"
        eyebrow={t.eyebrow}
        title={t.title}
        description={t.subtitle}
      />

      <div className="mt-[clamp(48px,7vh,80px)] flex flex-col gap-[clamp(56px,8vh,104px)]">
        <div className="grid items-center gap-[clamp(28px,4vw,64px)] md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <FlowWell>
            <div className="w-[92%] pb-[clamp(56px,7vw,84px)]">
              <ChecklistMock t={t.checklist} />
            </div>
            <div className="relative z-10 -mt-[clamp(46px,6vw,70px)] ml-auto w-[86%] pb-[clamp(20px,3vw,32px)]">
              <ProgressMock t={t.progress} />
            </div>
          </FlowWell>

          <div className="flex flex-col gap-[clamp(24px,3.5vh,36px)]">
            <OnboardingFlowBlurb
              index={1}
              title={t.checklist.title}
              description={t.checklist.description}
            />
            <OnboardingFlowBlurb
              index={2}
              title={t.progress.title}
              description={t.progress.description}
            />
          </div>
        </div>

        <div className="grid items-center gap-[clamp(28px,4vw,64px)] md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <FlowWell className="md:order-2">
            <div className="ml-auto w-[92%] pb-[clamp(56px,7vw,84px)]">
              <QuestionsMock t={t.questions} />
            </div>
            <div className="relative z-10 -mt-[clamp(46px,6vw,70px)] w-[86%] pb-[clamp(20px,3vw,32px)]">
              <CourseMock t={t.course} />
            </div>
          </FlowWell>

          <div className="flex flex-col gap-[clamp(24px,3.5vh,36px)] md:order-1">
            <OnboardingFlowBlurb
              index={3}
              title={t.questions.title}
              description={t.questions.description}
            />
            <OnboardingFlowBlurb
              index={4}
              title={t.course.title}
              description={t.course.description}
            />
          </div>
        </div>
      </div>
    </MarketingSection>
  );
}
