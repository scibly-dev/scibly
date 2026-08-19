import { IDLE_KEY } from "@/app/[lang]/components/marketing-tokens";

import { flatKey, PREVIEW_PLACEHOLDER } from "../hero-preview-kit";
import { type GamificationCopy } from "./gamification-copy";
import { PILLAR, RULE, SELECTED } from "./gamification-theme";
import { SceneCard } from "./scene-card";

export function QuizPeek({ t }: { t: GamificationCopy }) {
  return (
    <SceneCard size="peek" progress={48}>
      <div className="px-2.5 pt-1.5 pb-2.5">
        <p className="text-ink m-0 mb-2 text-[10px] leading-snug font-bold">
          {t.question}
        </p>
        <div className="flex w-full flex-col gap-1">
          <McOption label={t.optWrong} />
          <McOption label={t.optCorrect} selected />
          {/* The options the card runs out of room for. */}
          <div
            className="flex min-h-[1.75rem] items-center gap-1.5 rounded-[9px] border border-dashed px-2 py-1 text-[9px] font-bold"
            style={{ borderColor: RULE, color: PREVIEW_PLACEHOLDER }}
          >
            <span
              className="size-3 shrink-0 rounded-full border"
              style={{ borderColor: RULE }}
            />
            <span className="truncate">…</span>
          </div>
        </div>
      </div>
    </SceneCard>
  );
}

function McOption({ label, selected }: { label: string; selected?: boolean }) {
  return (
    <div
      className="flex min-h-[1.75rem] w-full items-center gap-1.5 rounded-[9px] border px-2 py-1 text-[9px] leading-snug font-bold"
      style={flatKey(selected ? SELECTED : IDLE_KEY, 2)}
    >
      <span
        className="size-3 shrink-0 rounded-full border"
        style={{
          borderColor: selected ? PILLAR.accentColor : IDLE_KEY.edge,
          backgroundColor: selected ? PILLAR.accentColor : "#ffffff",
        }}
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </div>
  );
}
