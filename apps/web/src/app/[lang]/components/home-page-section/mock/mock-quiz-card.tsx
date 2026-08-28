import { cn } from "@scibly/ui/utils";
import { Check } from "lucide-react";
import { type ComponentPropsWithoutRef } from "react";

import {
  CORRECT_KEY,
  type Pillar,
  tint,
} from "@/app/[lang]/components/marketing-tokens";

import { MUTED } from "./mock-theme";

interface MockQuizCardProps extends ComponentPropsWithoutRef<"div"> {
  tone: Pillar;
  question: string;
  wrongOption: string;
  rightOption: string;
  truncateOptions?: boolean;
}

export function MockQuizCard({
  tone,
  question,
  wrongOption,
  rightOption,
  truncateOptions = false,
  className,
  style,
  ...rest
}: MockQuizCardProps) {
  const optionLabel = cn("text-[11px]", truncateOptions && "min-w-0 truncate");

  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-[10px] border-2 p-2.5",
        className,
      )}
      style={{ borderColor: CORRECT_KEY.face, ...style }}
      {...rest}
    >
      <p className="text-ink m-0 text-[11.5px] font-bold">{question}</p>
      <div
        className="flex items-center gap-2 rounded-[7px] px-2 py-1.5"
        style={{ backgroundColor: tint(tone.softColor, 35) }}
      >
        <span className="size-3 shrink-0 rounded-full border-2 border-[#c6cde6] bg-white" />
        <span className={optionLabel} style={{ color: MUTED }}>
          {wrongOption}
        </span>
      </div>
      <div
        className="flex items-center gap-2 rounded-[7px] px-2 py-1.5"
        style={{ backgroundColor: CORRECT_KEY.face, color: CORRECT_KEY.ink }}
      >
        <span className="flex size-3 shrink-0 items-center justify-center rounded-full bg-white">
          <Check size={8} strokeWidth={3.5} />
        </span>
        <span className={cn(optionLabel, "font-bold")}>{rightOption}</span>
      </div>
    </div>
  );
}
