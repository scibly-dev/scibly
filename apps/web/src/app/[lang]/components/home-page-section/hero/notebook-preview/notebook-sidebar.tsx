import { cn } from "@scibly/ui/utils";
import { ArrowLeft, History, Plus } from "lucide-react";
import Image from "next/image";

import { SCIBLY_MARK_SRC } from "@/lib/marketing-assets";

import { flatKey, pressableStyle, PREVIEW_META } from "../hero-preview-kit";
import { type NotebookCopy } from "./notebook-copy";
import { ACCENT, RAIL, RULE, SELECTED } from "./notebook-theme";

export function NotebookSidebar({ t }: { t: NotebookCopy }) {
  return (
    <aside
      className="hidden w-[176px] shrink-0 flex-col border-r lg:flex xl:w-[188px]"
      style={{ backgroundColor: RAIL, borderColor: RULE }}
    >
      <div className="flex flex-col gap-2.5 px-3 pt-3.5 pb-3">
        <div className="flex items-center gap-1.5">
          <Image
            src={SCIBLY_MARK_SRC}
            alt=""
            width={18}
            height={18}
            className="size-[18px] shrink-0 rounded-[5px]"
          />
          <span className="text-ink text-[13.5px] font-bold tracking-[-0.01em]">
            {t.brand}
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1 text-[11.5px] font-semibold"
          style={{ color: PREVIEW_META }}
        >
          <ArrowLeft size={12} strokeWidth={2.4} />
          {t.leave}
        </span>
        <div
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[12px] text-[12px] font-bold"
          style={pressableStyle(ACCENT)}
        >
          <Plus size={13} strokeWidth={2.6} />
          {t.newNotebook}
        </div>
      </div>

      <div className="px-2.5 pb-3">
        <div
          className="mb-1.5 flex items-center gap-1 px-1 text-[10.5px] font-semibold"
          style={{ color: PREVIEW_META }}
        >
          <History size={10} strokeWidth={2.4} />
          {t.history}
        </div>
        <div className="flex flex-col gap-1.5">
          <HistoryItem label={t.historyActive} active />
          <HistoryItem label={t.historyItemTwo} />
          <HistoryItem label={t.historyItemThree} />
        </div>
      </div>
    </aside>
  );
}

function HistoryItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className={cn(
        "truncate rounded-[10px] border px-2.5 py-1.5 text-[11px] leading-snug",
        active ? "font-bold" : "border-transparent font-semibold",
      )}
      style={active ? flatKey(SELECTED, 2) : { color: PREVIEW_META }}
    >
      {label}
    </div>
  );
}
