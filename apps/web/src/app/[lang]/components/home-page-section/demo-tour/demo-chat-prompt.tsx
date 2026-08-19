"use client";

import type { Locale } from "@scibly/i18n/constants";

import { autocaptureAttributes } from "@scibly/observability/autocapture";
import {
  DEMO_INITIAL_MESSAGE_MAX_LENGTH,
  demoHrefWithInitialMessage,
} from "@scibly/routes";
import { cn } from "@scibly/ui/utils";
import { ArrowUp } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useState } from "react";

import {
  useInViewOnce,
  usePrefersReducedMotion,
} from "@/components/in-view-reveal";
import { useDemoTimeline } from "@/components/use-demo-timeline";

import { DemoModelSelector } from "./demo-model-selector";
import { type DemoTourDictionary } from "./i18n/demo-tour.types";

interface DemoChatPromptProps {
  t: DemoTourDictionary;
  href: string;
  locale: Locale;
}

type ComposerState = "seeding" | "seeded" | "manual";

const TYPE_MS = 22;

const SEED_DELAY_MS = 350;

export function DemoChatPrompt({ t, href, locale }: DemoChatPromptProps) {
  const seed = t.seedPrompt;
  const [value, setValue] = useState("");
  const [state, setState] = useState<ComposerState>("seeding");
  const reduceMotion = usePrefersReducedMotion();
  const { ref: inViewRef, inView } = useInViewOnce<HTMLDivElement>(0.4);

  useDemoTimeline(inView && state === "seeding", async (wait) => {
    if (reduceMotion) {
      await wait(SEED_DELAY_MS);
    } else {
      for (let typed = 1; typed <= seed.length; typed += 1) {
        await wait(TYPE_MS);
        setValue(seed.slice(0, typed));
      }
    }

    setValue(seed);
    setState("seeded");
  });

  const markInteracted = () => setState("manual");

  const sendArmed =
    state === "seeded" || (state === "manual" && value.trim().length > 0);

  const goToDemo = () => {
    if (!sendArmed) return;
    window.location.assign(demoHrefWithInitialMessage(href, value));
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    goToDemo();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      goToDemo();
      return;
    }
    markInteracted();
  };

  return (
    <div
      ref={inViewRef}
      className="font-display pointer-events-auto relative mx-auto w-full"
    >
      <form
        onSubmit={onSubmit}
        className="relative rounded-[18px] border border-[#e2e8f0] bg-white px-[18px] pt-[18px] pb-3 shadow-[0_18px_38px_-26px_rgba(15,23,42,0.42),0_1px_5px_rgba(15,23,42,0.045)] focus-within:border-[#0066FF]/35"
        data-hero-demo-composer
      >
        <label className="sr-only" htmlFor="demo-chat-prompt">
          {t.placeholder}
        </label>
        <textarea
          id="demo-chat-prompt"
          maxLength={DEMO_INITIAL_MESSAGE_MAX_LENGTH}
          rows={2}
          value={value}
          onChange={(e) => {
            markInteracted();
            setValue(e.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder={t.placeholder}
          className="block w-full resize-none border-0 bg-transparent px-0.5 pt-0.5 pb-2.5 text-[15px] leading-[1.55] text-[#0f172a] outline-none placeholder:text-[#94a3b8]"
        />

        <div className="flex items-center justify-between gap-2.5">
          <DemoModelSelector
            models={t.models}
            menuLabel={t.modelMenuLabel}
            triggerLabel={t.modelTriggerLabel}
          />

          <button
            type="submit"
            disabled={!sendArmed}
            title={sendArmed ? t.sendLabel : undefined}
            className={cn(
              "ease-press flex size-10 shrink-0 items-center justify-center rounded-xl text-white transition-[translate,box-shadow,background-color] duration-100 focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 focus-visible:outline-none",
              sendArmed
                ? "bg-[#0066FF] shadow-[0_3px_0_0_#0046ad,0_6px_14px_-7px_rgba(0,70,173,0.55),inset_0_1px_0_rgba(255,255,255,0.3)] hover:bg-[#1a76ff] active:translate-y-[3px] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]"
                : "cursor-not-allowed bg-[#94a3b8]/55 shadow-none",
            )}
            aria-label={t.sendLabel}
            {...(sendArmed
              ? autocaptureAttributes({
                  cta: "notebook_demo_send",
                  locale,
                  placement: "homepage_demo_tour",
                })
              : {})}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </form>
    </div>
  );
}
