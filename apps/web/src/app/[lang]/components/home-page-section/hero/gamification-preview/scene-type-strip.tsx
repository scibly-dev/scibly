import { MessageCircle } from "lucide-react";

import { IDLE_KEY } from "@/app/[lang]/components/marketing-tokens";

import { flatKey, PREVIEW_META } from "../hero-preview-kit";
import { type GamificationCopy } from "./gamification-copy";
import { PILLAR, RULE } from "./gamification-theme";

export function SceneTypeStrip({ t }: { t: GamificationCopy }) {
  return (
    <div
      className="flex h-10 shrink-0 items-end gap-1 border-b px-3 sm:h-11 sm:px-4 md:px-5"
      style={{ borderColor: RULE }}
    >
      <SceneTypeChip label={t.sceneTypeQuiz} />
      <SceneTypeChip label={t.sceneTypeCloze} active />
      <SceneTypeChip label={t.sceneTypeSort} />

      <div className="ml-auto hidden max-w-[280px] min-w-0 items-center gap-2 pb-2 lg:flex xl:max-w-[340px]">
        <span
          className="flex size-6 shrink-0 items-center justify-center rounded-[8px] border"
          style={flatKey(IDLE_KEY, 0)}
        >
          <MessageCircle size={12} strokeWidth={2.4} />
        </span>
        <p
          className="m-0 truncate text-[11px] font-semibold"
          style={{ color: PREVIEW_META }}
        >
          {t.guideTip}
        </p>
      </div>
    </div>
  );
}

function SceneTypeChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className="relative px-2.5 pb-2.5 text-[11.5px] font-bold sm:px-3 sm:text-[12.5px]"
      style={{ color: active ? PILLAR.accentColor : PREVIEW_META }}
    >
      {label}
      {active ? (
        <span
          className="absolute inset-x-2.5 bottom-0 h-[2px] rounded-full sm:inset-x-3"
          style={{ backgroundColor: PILLAR.accentColor }}
          aria-hidden
        />
      ) : null}
    </span>
  );
}
