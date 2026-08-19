"use client";

import type { CourseMode } from "@scibly/db/enums";

import { cn } from "@scibly/ui/utils";

import { type CoursesTranslations } from "@/features/course-authoring/contracts";
import { DisabledReasonTooltip } from "@/shared/ui/components/tooltip";

const cardClass =
  "flex-1 cursor-pointer rounded-xl border-2 p-3 text-left transition-[translate,box-shadow,background-color,border-color] duration-100 ease-press active:translate-y-[3px] active:shadow-none focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

const cardSelectedClass =
  "border-[#0066FF] bg-[#0066FF]/5 shadow-[0_3px_0_0_#b9d7ff]";

const cardRestClass =
  "border-hairline bg-white shadow-[0_3px_0_0_var(--color-edge)] hover:border-edge";

function ModeCard({
  description,
  label,
  onSelect,
  selected,
  locked,
}: {
  description: string;
  label: string;
  onSelect: () => void;
  selected: boolean;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={locked}
      aria-pressed={selected}
      className={cn(cardClass, selected ? cardSelectedClass : cardRestClass)}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "size-3.5 shrink-0 rounded-full border-2",
            selected ? "border-[#0066FF] bg-[#0066FF]" : "border-edge",
          )}
          aria-hidden
        />
        <span className="text-ink text-sm font-semibold">{label}</span>
      </span>
      <span className="text-ink-soft mt-1 block text-xs">{description}</span>
    </button>
  );
}

export function CourseModeField({
  value,
  onChange,
  lockedReason,
  t,
}: {
  value: CourseMode;
  onChange: (mode: CourseMode) => void;

  lockedReason?: string | null;
  t: CoursesTranslations;
}) {
  const copy = t.mode;

  return (
    <div className="border-hairline grid gap-3 border-b-2 pb-5">
      <p className="text-ink-soft text-xs font-semibold tracking-wider uppercase">
        {copy.sectionTitle}
      </p>
      <div className="flex items-stretch gap-3">
        <ModeCard
          label={copy.courseLabel}
          description={copy.courseDescription}
          selected={value === "COURSE"}
          onSelect={() => onChange("COURSE")}
        />
        <DisabledReasonTooltip
          reason={lockedReason ?? null}
          className="flex flex-1"
        >
          <ModeCard
            label={copy.lessonLabel}
            description={copy.lessonDescription}
            selected={value === "LESSON"}
            locked={Boolean(lockedReason)}
            onSelect={() => onChange("LESSON")}
          />
        </DisabledReasonTooltip>
      </div>
    </div>
  );
}
