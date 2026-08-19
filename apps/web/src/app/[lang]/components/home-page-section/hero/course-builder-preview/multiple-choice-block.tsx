import { Check } from "lucide-react";

import {
  CORRECT_KEY,
  IDLE_KEY,
} from "@/app/[lang]/components/marketing-tokens";

import { flatKey, PREVIEW_META, previewTrayStyle } from "../hero-preview-kit";
import { type CourseBuilderCopy } from "./builder-copy";
import { type Breakpoint, PILLAR, showFromClass } from "./builder-theme";

export function MultipleChoiceBlock({
  t,
  compact,
}: {
  t: CourseBuilderCopy;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[14px] border px-2 ${compact ? "py-2" : "py-2.5"}`}
      style={previewTrayStyle(PILLAR)}
    >
      <div className="mb-1.5 flex items-center justify-between px-1">
        <span
          className="text-[10px] font-semibold"
          style={{ color: PREVIEW_META }}
        >
          {t.mcLabel}
        </span>
        <span
          className="rounded border px-1.5 text-[9px] font-bold"
          style={flatKey(IDLE_KEY)}
        >
          ···
        </span>
      </div>
      <div className={`flex flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
        <AuthorOption label={t.optOne} />
        <AuthorOption label={t.optTwo} correct />
        {!compact ? <AuthorOption label={t.optThree} showFrom="lg" /> : null}
      </div>
      {!compact ? (
        <div
          className="mt-2 px-1 text-left text-[11px] font-bold"
          style={{ color: PILLAR.accentColor }}
        >
          + {t.addOption}
        </div>
      ) : null}
    </div>
  );
}

function AuthorOption({
  label,
  correct,
  showFrom,
}: {
  label: string;
  correct?: boolean;
  showFrom?: Breakpoint;
}) {
  return (
    <div
      className={`min-h-[2rem] items-center gap-2 rounded-[11px] border px-2.5 py-1.5 text-[11.5px] leading-snug font-bold ${showFromClass(showFrom)}`}
      style={flatKey(correct ? CORRECT_KEY : IDLE_KEY, 2)}
    >
      <span
        className="flex size-[15px] shrink-0 items-center justify-center rounded-[4px] border"
        style={
          correct
            ? {
                backgroundColor: CORRECT_KEY.edge,
                borderColor: CORRECT_KEY.edge,
                color: "#ffffff",
              }
            : { backgroundColor: "#ffffff", borderColor: IDLE_KEY.edge }
        }
      >
        {correct ? <Check size={9} strokeWidth={3.5} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
    </div>
  );
}
