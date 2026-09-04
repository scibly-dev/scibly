"use client";

import { useTranslation } from "@/i18n/hooks/use-translation";
import { MessageResponse } from "@/shared/ai/components/message";

import { eyebrowClass } from "./styles";

export function ExplanationNote({ explanation }: { explanation: string }) {
  const { translations } = useTranslation("editorUi");
  return (
    <div className="shrink-0 border-l-2 border-blue-500/70 pl-4">
      <span className={eyebrowClass}>{translations.practice.learnerReads}</span>
      <MessageResponse className="text-ink-soft mt-1.5 text-[12px] leading-relaxed dark:text-neutral-300">
        {explanation}
      </MessageResponse>
    </div>
  );
}
