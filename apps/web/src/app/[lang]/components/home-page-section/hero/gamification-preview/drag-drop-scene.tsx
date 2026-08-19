import { GripHorizontal } from "lucide-react";

import { IDLE_KEY, tint } from "@/app/[lang]/components/marketing-tokens";

import {
  flatKey,
  PREVIEW_META,
  PREVIEW_PLACEHOLDER,
  previewTrayStyle,
  previewWash,
} from "../hero-preview-kit";
import { type GamificationCopy } from "./gamification-copy";
import { PILLAR } from "./gamification-theme";
import { SceneCard } from "./scene-card";

export function DragDropScene({ t }: { t: GamificationCopy }) {
  const [zoneA, zoneB, zoneC] = t.dndZones;
  const [itemA, itemB] = t.dndItems;

  return (
    <SceneCard size="peek" progress={74}>
      <div className="px-2.5 pt-1.5 pb-2.5">
        <p className="text-ink m-0 mb-1.5 text-[10px] leading-snug font-bold">
          {t.dndPrompt}
        </p>
        <div className="mb-1">
          <span
            className="text-[9.5px] font-semibold"
            style={{ color: PREVIEW_META }}
          >
            {t.dndAvailableLabel}
          </span>
        </div>
        <div
          className="mb-2 flex min-h-[2.75rem] flex-col gap-1 rounded-[12px] border p-1.5"
          style={previewTrayStyle(PILLAR)}
        >
          <DndChip label={itemA} />
          <DndChip label={itemB} clamp={1} />
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <DropZonePreview label={zoneA} />
          <DropZonePreview label={zoneB} placed={t.dndPlacedItem} />
        </div>
        <div className="mt-1.5">
          <DropZonePreview label={zoneC} compact />
        </div>
      </div>
    </SceneCard>
  );
}

function DndChip({ label, clamp = 2 }: { label: string; clamp?: 1 | 2 }) {
  return (
    <div
      className="max-w-full rounded-[10px] border px-2 py-1.5 text-[9px] leading-snug font-bold select-none"
      style={flatKey(IDLE_KEY, 2)}
    >
      <div className="flex min-w-0 items-start gap-1">
        <GripHorizontal
          className="mt-0.5 size-3 shrink-0"
          style={{ color: PREVIEW_PLACEHOLDER }}
        />
        <span
          className={`${clamp === 1 ? "line-clamp-1" : "line-clamp-2"} min-w-0 flex-1`}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function DropZonePreview({
  label,
  placed,
  compact,
}: {
  label: string;
  placed?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-[12px] border border-dashed p-1.5 ${compact ? "min-h-[2.25rem]" : "min-h-[3.25rem]"}`}
      style={{
        backgroundColor: previewWash(PILLAR, 34),
        borderColor: tint(PILLAR.lipColor, 55),
      }}
    >
      <div
        className="text-[9.5px] font-semibold"
        style={{ color: PREVIEW_META }}
      >
        {label}
      </div>
      {placed ? <DndChip label={placed} /> : null}
    </div>
  );
}
