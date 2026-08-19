"use client";

import { BENTO_EASE } from "../../keyframes";
import {
  flatKey,
  PREVIEW_META,
  previewCanvasStyle,
  previewCardStyle,
} from "../hero-preview-kit";
import { type SlashCommandId } from "../i18n/hero.types";
import { type CourseBuilderCopy } from "./builder-copy";
import { PILLAR, RULE, SELECTED } from "./builder-theme";
import { MultipleChoiceBlock } from "./multiple-choice-block";
import { SlashCommandMenu } from "./slash-command-menu";
import { TypedParagraph } from "./typed-paragraph";

export type CanvasPhase = "hint" | "slash" | "menu" | "inserted";

export function AuthorCanvas({
  t,
  phase,
  activeId,
  loopKey,
}: {
  t: CourseBuilderCopy;
  phase: CanvasPhase;
  activeId: SlashCommandId | null;
  loopKey: number;
}) {
  const showMenu = phase === "menu";
  const showSlash = phase === "slash" || phase === "menu";
  const showHint = phase === "hint";
  const showBlock = phase === "inserted";

  return (
    <div
      className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      style={{
        ...previewCanvasStyle(PILLAR),
        animation: `sc-rise 780ms ${BENTO_EASE} 220ms both`,
      }}
    >
      <div
        className="m-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border md:m-3"
        style={previewCardStyle(PILLAR)}
      >
        <div
          className="flex shrink-0 items-center justify-between border-b px-3.5 py-2 sm:px-4"
          style={{ borderColor: RULE }}
        >
          <span
            className="text-[10.5px] font-semibold"
            style={{ color: PREVIEW_META }}
          >
            {t.sceneLabel}
          </span>
          <span
            className="rounded-full border px-2 text-[10px] font-bold"
            style={flatKey(SELECTED)}
          >
            2 / 4
          </span>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-3.5 pt-3 pb-3.5 sm:px-4 sm:pb-4">
          <h4 className="text-ink m-0 text-left text-[14.5px] leading-tight font-bold tracking-[-0.01em] md:text-[15.5px]">
            {t.heading}
          </h4>

          {!showBlock ? (
            <div className="relative z-[2] min-h-[22px]">
              {showHint ? (
                <div className="flex items-start gap-1.5">
                  <DragHandle />
                  <p
                    className="m-0 flex-1 text-left text-[12px] leading-snug font-medium md:text-[12.5px]"
                    style={{ color: PREVIEW_META }}
                  >
                    {t.slashHint}
                  </p>
                </div>
              ) : null}

              {showSlash ? (
                <div className="flex items-center gap-1.5">
                  <DragHandle />
                  <span className="text-ink text-[13.5px] font-bold">/</span>
                  <span
                    className="inline-block h-[15px] w-[2px] rounded-full"
                    style={{ backgroundColor: PILLAR.accentColor }}
                    aria-hidden
                  />
                </div>
              ) : null}

              {showMenu ? (
                <div
                  className="pointer-events-none absolute top-[calc(100%+6px)] left-0 z-20 w-[min(100%,224px)] sm:w-[240px]"
                  style={{ animation: `sc-rise 520ms ${BENTO_EASE} both` }}
                >
                  <SlashCommandMenu t={t} activeId={activeId} />
                </div>
              ) : null}
            </div>
          ) : null}

          {showMenu ? (
            <div className="pointer-events-none relative mt-1 opacity-[0.22]">
              <MultipleChoiceBlock t={t} compact />
            </div>
          ) : null}

          {showBlock ? (
            <div
              key={`mc-inserted-${loopKey}`}
              className="relative flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden"
              style={{ animation: `sc-rise 620ms ${BENTO_EASE} both` }}
            >
              <MultipleChoiceBlock t={t} />
              <div className="flex items-start gap-1.5 px-0.5">
                <DragHandle />
                <TypedParagraph text={t.bodyParagraph} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DragHandle() {
  return (
    <span
      className="mt-1 grid h-3.5 w-2.5 shrink-0 grid-cols-2 gap-[1.5px] opacity-45"
      aria-hidden
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <span
          key={i}
          className="h-[2px] w-[2px] rounded-full"
          style={{ backgroundColor: PREVIEW_META }}
        />
      ))}
    </span>
  );
}
