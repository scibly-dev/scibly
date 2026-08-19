"use client";

import { useState } from "react";

import { usePrefersReducedMotion } from "@/components/in-view-reveal";
import { useDemoTimeline } from "@/components/use-demo-timeline";

import { PILLAR } from "./builder-theme";

const START_MS = 550;
const CHAR_MS = 26;

const LONGEST_TYPE_MS = 3200;
const SETTLE_MS = 350;

export function typingDurationMs(length: number): number {
  const typing = Math.min(Math.max(length, 1) * CHAR_MS, LONGEST_TYPE_MS);
  return START_MS + typing + SETTLE_MS;
}

export function TypedParagraph({ text }: { text: string }) {
  const reduceMotion = usePrefersReducedMotion();
  const [typed, setTyped] = useState(0);

  useDemoTimeline(!reduceMotion, async (wait) => {
    await wait(START_MS);
    for (let count = 1; count <= text.length; count += 1) {
      await wait(CHAR_MS);
      setTyped(count);
    }
  });

  const count = reduceMotion ? text.length : typed;

  return (
    <p className="m-0 flex-1 text-left text-[12.5px] leading-[1.55] text-[#3b4574] md:text-[13px]">
      {text.slice(0, count)}
      {count < text.length ? (
        <span
          className="ml-px inline-block h-[13px] w-[2px] translate-y-[2px] rounded-full align-baseline"
          style={{ backgroundColor: PILLAR.accentColor }}
          aria-hidden
        />
      ) : null}
    </p>
  );
}
