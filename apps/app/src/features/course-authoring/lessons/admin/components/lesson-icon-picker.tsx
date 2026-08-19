"use client";

import { LessonIcon } from "@scibly/db/enums";
import {
  chipActiveClass,
  chipClass,
  chipRestClass,
} from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";

import { LessonIconGlyph } from "@/shared/content/course/components/lesson-icon-glyph";
import { LESSON_ICON_OPTIONS } from "@/shared/content/course/lesson-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/components/tooltip";

const ICON_LABEL_KEYS = {
  [LessonIcon.BOOK]: "book",
  [LessonIcon.LIGHTBULB]: "lightbulb",
  [LessonIcon.PRACTICE]: "practice",
  [LessonIcon.MILESTONE]: "milestone",
} satisfies Record<LessonIcon, keyof LessonIconLabels>;

type LessonIconLabel = {
  title: string;
  description: string;
};

type LessonIconLabels = {
  book: LessonIconLabel;
  lightbulb: LessonIconLabel;
  practice: LessonIconLabel;
  milestone: LessonIconLabel;
};

interface LessonIconPickerProps {
  value: LessonIcon;
  onChange: (icon: LessonIcon) => void;
  labels: LessonIconLabels;
  disabled?: boolean;
}

export function LessonIconPicker({
  value,
  onChange,
  labels,
  disabled = false,
}: LessonIconPickerProps) {
  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex flex-wrap gap-2">
        {LESSON_ICON_OPTIONS.map((icon) => {
          const isSelected = value === icon;
          const { title, description } = labels[ICON_LABEL_KEYS[icon]];

          return (
            <Tooltip key={icon}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(icon)}
                  aria-label={title}
                  aria-describedby={undefined}
                  aria-pressed={isSelected}
                  className={cn(
                    chipClass,
                    isSelected ? chipActiveClass : chipRestClass,
                    "flex h-11 w-11 items-center justify-center px-0 py-0",
                    disabled && "pointer-events-none opacity-50",
                  )}
                >
                  <LessonIconGlyph icon={icon} className="h-5 w-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={8}
                className="border-ink bg-ink max-w-[15rem] rounded-xl border-2 px-3 py-2.5 text-left"
              >
                <p className="text-[13px] leading-tight font-semibold text-white">
                  {title}
                </p>
                <p className="mt-1 text-[12px] leading-snug text-white/70">
                  {description}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
