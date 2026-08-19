import { Plus } from "lucide-react";

import { IDLE_KEY } from "@/app/[lang]/components/marketing-tokens";

import { flatKey, PREVIEW_META } from "../hero-preview-kit";
import { type CourseBuilderCopy } from "./builder-copy";
import {
  type Breakpoint,
  PILLAR,
  RAIL,
  rowMarkerStyle,
  RULE,
  SELECTED,
  showFromClass,
} from "./builder-theme";

export function SceneList({ t }: { t: CourseBuilderCopy }) {
  return (
    <aside
      className="hidden h-full min-h-0 w-[160px] shrink-0 flex-col overflow-hidden border-r md:flex lg:w-[176px] xl:w-[188px]"
      style={{ backgroundColor: RAIL, borderColor: RULE }}
    >
      <div className="flex shrink-0 items-center justify-between px-3 pt-3 pb-2">
        <span
          className="text-[10.5px] font-semibold"
          style={{ color: PREVIEW_META }}
        >
          {t.scenes}
        </span>
        <span
          className="rounded-md border px-1.5 text-[10px] font-bold"
          style={flatKey(IDLE_KEY)}
        >
          {t.sceneCount}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto px-2.5 pb-3">
        <SceneCard index={1} label={t.sceneOne} />
        <SceneCard index={2} label={t.sceneTwo} active />
        <SceneCard index={3} label={t.sceneThree} />
        <SceneCard index={4} label={t.sceneFour} showFrom="xl" />
        <div
          className="mt-1 flex items-center justify-center gap-1 rounded-[11px] border border-dashed py-2 text-[10.5px] font-bold"
          style={{ borderColor: RULE, color: PILLAR.accentColor }}
        >
          <Plus size={12} strokeWidth={2.6} />
          {t.addScene}
        </div>
      </div>
    </aside>
  );
}

function SceneCard({
  index,
  label,
  active,
  showFrom,
}: {
  index: number;
  label: string;
  active?: boolean;
  showFrom?: Breakpoint;
}) {
  return (
    <div
      className={`items-start gap-2 rounded-[11px] border px-2 py-1.5 ${showFromClass(showFrom)}`}
      style={
        active
          ? flatKey(SELECTED, 2)
          : { borderColor: "transparent", color: PREVIEW_META }
      }
    >
      <span
        className="mt-px flex size-4 shrink-0 items-center justify-center rounded-[5px] border text-[9px] font-bold"
        style={rowMarkerStyle(active)}
      >
        {index}
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-left text-[10.5px] leading-snug ${active ? "font-bold" : "font-semibold"}`}
      >
        {label}
      </span>
    </div>
  );
}
