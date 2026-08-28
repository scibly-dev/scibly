import {
  Database,
  GitPullRequest,
  Mic,
  ShieldCheck,
  Sparkles,
  Ticket,
} from "lucide-react";

import { CORRECT_KEY, tint } from "@/app/[lang]/components/marketing-tokens";
import { BrandLogo } from "@/components/brand-logo";

import { MockQuizCard } from "../mock/mock-quiz-card";
import { enter, FAINT, MUTED } from "../mock/mock-theme";
import { MockWindow } from "../mock/mock-window";
import { MockWindowBar } from "../mock/mock-window-bar";
import { CardCanvas } from "./card-canvas";
import {
  type KnowledgeDictionary,
  type LessonDictionary,
} from "./i18n/knowledge-sources.types";
import {
  INTERVIEW_TONE,
  LESSON_TONE,
  SLACK_TONE,
  WORK_TONE,
} from "./knowledge-sources-tones";

export function LessonCanvas({
  knowledge,
  t,
}: {
  knowledge: KnowledgeDictionary;
  t: LessonDictionary;
}) {
  const facts = [
    {
      text: knowledge.fact1,
      sources: [
        {
          key: "slack",
          tone: SLACK_TONE,
          icon: <BrandLogo domain="slack.com" alt="" size={9} />,
        },
        {
          key: "git",
          tone: WORK_TONE,
          icon: <GitPullRequest size={10} strokeWidth={2.6} />,
        },
      ],
    },
    {
      text: knowledge.fact2,
      sources: [
        {
          key: "interview",
          tone: INTERVIEW_TONE,
          icon: <Mic size={10} strokeWidth={2.6} />,
        },
        {
          key: "ticket",
          tone: WORK_TONE,
          icon: <Ticket size={10} strokeWidth={2.6} />,
        },
      ],
    },
  ];

  return (
    <CardCanvas tone={LESSON_TONE}>
      <MockWindow className="absolute inset-x-5 top-5">
        <MockWindowBar>
          <Database
            size={12}
            strokeWidth={2.6}
            style={{ color: LESSON_TONE.accentColor }}
          />
          <span className="truncate">{knowledge.eyebrow}</span>
          <span
            className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-[4px] px-1.5 py-px text-[9.5px] font-bold"
            style={{
              backgroundColor: CORRECT_KEY.face,
              color: CORRECT_KEY.ink,
            }}
          >
            <ShieldCheck size={10} strokeWidth={2.8} />
            {knowledge.verifiedLabel}
          </span>
        </MockWindowBar>

        <div className="flex flex-col gap-2 px-3.5 pt-2.5 pb-16">
          <p className="text-ink m-0 text-[14px] leading-snug font-bold tracking-[-0.01em]">
            {knowledge.title}
          </p>
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {facts.map((fact, index) => (
              <li key={index} className="flex items-start gap-2">
                <span
                  className="mt-[6px] size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: LESSON_TONE.accentColor }}
                />
                <span
                  className="min-w-0 text-[11.5px] leading-[1.45]"
                  style={{ color: MUTED }}
                >
                  {fact.text}{" "}
                  <span className="inline-flex translate-y-[2px] gap-0.5">
                    {fact.sources.map((source) => (
                      <span
                        key={source.key}
                        className="inline-flex size-[15px] shrink-0 items-center justify-center rounded-[5px]"
                        style={{
                          backgroundColor: source.tone.softColor,
                          color: source.tone.accentColor,
                        }}
                      >
                        {source.icon}
                      </span>
                    ))}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </MockWindow>

      <MockWindow
        data-bento-anim
        className="absolute top-[158px] right-3 left-9 border-2"
        style={{
          borderColor: tint(LESSON_TONE.lipColor, 70),
          ...enter("sc-catch", 720),
        }}
      >
        <MockWindowBar>
          <span
            className="rounded-[4px] px-1.5 py-px text-[9.5px] font-bold tracking-wide whitespace-nowrap uppercase"
            style={{
              backgroundColor: LESSON_TONE.softColor,
              color: LESSON_TONE.accentColor,
            }}
          >
            {t.lessonEyebrow}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[10px] font-semibold whitespace-nowrap"
            style={{ color: FAINT }}
          >
            <Sparkles size={10} strokeWidth={2.6} />
            {t.derivedLabel}
          </span>
        </MockWindowBar>

        <div className="flex flex-col gap-2 px-3.5 pt-2.5 pb-3">
          <p className="text-ink m-0 text-[13px] leading-snug font-bold tracking-[-0.01em]">
            {t.lessonTitle}
          </p>
          <MockQuizCard
            tone={LESSON_TONE}
            question={t.quizQuestion}
            wrongOption={t.quizOptionWrong}
            rightOption={t.quizOptionRight}
          />
        </div>
      </MockWindow>
    </CardCanvas>
  );
}
