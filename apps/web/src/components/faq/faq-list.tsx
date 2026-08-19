"use client";

import type { Locale } from "@scibly/i18n/constants";

import { autocaptureAttributes } from "@scibly/observability/autocapture";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@scibly/ui/components/accordion";
import { cn } from "@scibly/ui/utils";
import { MessageCircleQuestion, Plus } from "lucide-react";
import { useState } from "react";

import { CHAPTER_ICONS } from "@/app/[lang]/components/marketing-chapter-icons";
import {
  lipShadow,
  type PillarId,
  PILLARS,
  tint,
} from "@/app/[lang]/components/marketing-tokens";

import { createFaqOpenedSession } from "./faq-session-dedup";

export type FaqItem = {
  id: string;
  q: string;
  a: string;
};

export type FaqContext = "homepage" | "use-case";

const CHAPTER_CYCLE: PillarId[] = [
  "import",
  "byoai",
  "learner",
  "channels",
  "analytics",
];

function faqCaptureProperties(input: {
  faqId: string;
  context: FaqContext;
  locale: Locale;
  useCaseKey?: string;
}) {
  const { faqId, context, locale, useCaseKey } = input;
  const faqLabel =
    context === "homepage"
      ? `homepage / ${faqId}`
      : `${useCaseKey ?? "unknown"} / ${faqId}`;

  return {
    faq_context: context,
    faq_id: faqId,
    faq_label: faqLabel,
    locale,
    use_case_key: context === "use-case" ? useCaseKey : undefined,
  };
}

type FaqListProps = {
  questions: FaqItem[];
  locale: Locale;
  context: FaqContext;

  chapters?: Map<string, PillarId>;
  useCaseKey?: string;
  className?: string;
};

export function FaqList({
  questions,
  locale,
  context,
  chapters,
  useCaseKey,
  className,
}: FaqListProps) {
  const [openId, setOpenId] = useState<string>("");
  const [faqSession] = useState(createFaqOpenedSession);
  const { shouldCapture, markOpened } = faqSession;

  return (
    <Accordion
      type="single"
      collapsible
      className={cn("flex w-full flex-col gap-2.5", className)}
      value={openId}
      onValueChange={(value) => {
        if (value) {
          markOpened(value);
        }
        setOpenId(value);
      }}
    >
      {questions.map((item, index) => {
        const chapter = chapters?.get(item.id);
        const { softColor, lipColor, accentColor } =
          PILLARS[chapter ?? CHAPTER_CYCLE[index % CHAPTER_CYCLE.length]];
        const Icon = chapter ? CHAPTER_ICONS[chapter] : MessageCircleQuestion;
        const isOpen = openId === item.id;

        return (
          <AccordionItem
            key={item.id}
            value={item.id}
            className={cn(
              "rounded-[20px] border-2 border-b-2 bg-white transition-[background-color,border-color,box-shadow] duration-200",
              isOpen
                ? "border-transparent"
                : "border-hairline hover:border-[#d9e1f2]",
            )}
            style={
              isOpen
                ? {
                    backgroundColor: tint(softColor, 30),
                    borderColor: tint(softColor, 76),
                    boxShadow: `${lipShadow(tint(lipColor, 55))}, 0 22px 44px -34px rgba(19,28,70,0.45)`,
                  }
                : undefined
            }
          >
            <AccordionTrigger
              className="group text-ink hover:text-ink cursor-pointer gap-5 px-[clamp(16px,2vw,22px)] py-[18px] text-left text-[16.5px] leading-[1.4] font-medium tracking-[-0.012em] hover:no-underline"
              indicator={
                <span
                  className={cn(
                    "ease-press flex size-9 shrink-0 items-center justify-center rounded-[12px] transition-[transform,background-color,box-shadow,color] duration-200 motion-reduce:transition-none",
                    isOpen
                      ? ""
                      : "text-ink-soft bg-[#f2f4fb] group-hover:-translate-y-px",
                  )}
                  style={
                    isOpen
                      ? {
                          backgroundColor: softColor,
                          boxShadow: lipShadow(lipColor, 3),
                          color: accentColor,
                        }
                      : undefined
                  }
                  aria-hidden
                >
                  <Plus
                    size={17}
                    strokeWidth={2.4}
                    className={cn(
                      "ease-press transition-transform duration-200 motion-reduce:transition-none",
                      isOpen && "rotate-45",
                    )}
                  />
                </span>
              }
              {...autocaptureAttributes(
                faqCaptureProperties({
                  faqId: item.id,
                  context,
                  locale,
                  useCaseKey,
                }),
                {
                  capture: shouldCapture(item.id, !isOpen),
                },
              )}
            >
              <span className="flex items-center gap-3.5">
                <span
                  className="ease-press flex size-9 shrink-0 items-center justify-center rounded-[12px] transition-transform duration-200 group-hover:-translate-y-px motion-reduce:transition-none"
                  style={{
                    backgroundColor: softColor,
                    boxShadow: lipShadow(lipColor, 3),
                    color: accentColor,
                  }}
                  aria-hidden
                >
                  <Icon size={17} strokeWidth={2.2} />
                </span>
                {item.q}
              </span>
            </AccordionTrigger>
            {/* sm+: indent past the icon key instead of sitting under it. */}
            <AccordionContent className="text-ink-muted max-w-[70ch] px-[clamp(16px,2vw,22px)] pr-[clamp(16px,4vw,64px)] pb-[22px] text-[15.5px] leading-[1.65] text-pretty sm:pl-[calc(clamp(16px,2vw,22px)_+_50px)]">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
