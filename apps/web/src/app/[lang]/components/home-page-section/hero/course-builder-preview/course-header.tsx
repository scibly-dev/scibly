import { Clock, PlayCircle, Plus } from "lucide-react";

import { flatKey, PREVIEW_META } from "../hero-preview-kit";
import { type CourseBuilderCopy } from "./builder-copy";
import {
  ACCENT,
  type Breakpoint,
  PILLAR,
  RULE,
  showFromClass,
} from "./builder-theme";

export function CourseHeader({ t }: { t: CourseBuilderCopy }) {
  return (
    <div
      className="flex shrink-0 flex-col gap-2 border-b px-4 pt-3.5 pb-3 sm:px-5 md:pt-4 md:pb-3.5"
      style={{ borderColor: RULE }}
    >
      <p
        className="m-0 text-[10.5px] font-semibold"
        style={{ color: PREVIEW_META }}
      >
        {t.title}
      </p>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-ink m-0 min-w-0 flex-1 truncate text-[16px] font-bold tracking-[-0.015em] md:text-[17px]">
          {t.courseTitle}
        </h3>
        <div
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold"
          style={flatKey(ACCENT, 3)}
        >
          <PlayCircle size={13} strokeWidth={2.4} />
          <span className="hidden sm:inline">{t.previewCta}</span>
        </div>
      </div>
    </div>
  );
}

export function LessonTabs({ t }: { t: CourseBuilderCopy }) {
  return (
    <div
      className="flex h-11 shrink-0 items-end gap-1 overflow-hidden border-b px-3 sm:px-4 md:px-5"
      style={{ borderColor: RULE }}
    >
      <LessonTab label={t.lessonOne} active />
      <LessonTab label={t.lessonTwo} />
      <LessonTab label={t.lessonThree} showFrom="md" />
      <div className="ml-auto flex items-center gap-2 pr-0.5 pb-2.5">
        <span
          className="hidden items-center gap-1 text-[10.5px] font-semibold sm:inline-flex"
          style={{ color: PREVIEW_META }}
        >
          <Clock size={11} strokeWidth={2.4} />
          {t.estTime}
        </span>
        <span
          className="flex size-6 items-center justify-center rounded-md"
          style={{ color: PILLAR.accentColor }}
        >
          <Plus size={14} strokeWidth={2.6} />
        </span>
      </div>
    </div>
  );
}

function LessonTab({
  label,
  active,
  showFrom,
}: {
  label: string;
  active?: boolean;
  showFrom?: Breakpoint;
}) {
  return (
    <div
      className={`relative items-center px-2.5 pb-2.5 text-[11.5px] font-bold sm:px-3 sm:text-[12.5px] ${showFromClass(showFrom)}`}
      style={active ? { color: PILLAR.accentColor } : { color: PREVIEW_META }}
    >
      <span className="max-w-[9rem] truncate sm:max-w-none">{label}</span>
      {active ? (
        <span
          className="absolute inset-x-2.5 bottom-0 h-[2px] rounded-full sm:inset-x-3"
          style={{ backgroundColor: PILLAR.accentColor }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
