import { Monitor, RotateCcw, Smartphone } from "lucide-react";

import {
  CORRECT_KEY,
  IDLE_KEY,
} from "@/app/[lang]/components/marketing-tokens";

import { BENTO_EASE } from "../../keyframes";
import { PREVIEW_META, previewTrayStyle } from "../hero-preview-kit";
import { type CourseBuilderCopy } from "./builder-copy";
import { PILLAR, RULE } from "./builder-theme";
import { PhoneMock } from "./phone-mock";

export function PreviewSidebar({
  t,
  showBlock,
}: {
  t: CourseBuilderCopy;
  showBlock: boolean;
}) {
  return (
    <aside
      className="hidden h-full min-h-0 w-[220px] shrink-0 flex-col overflow-hidden border-l bg-white lg:flex xl:w-[240px]"
      style={{
        borderColor: RULE,
        animation: `sc-rise 780ms ${BENTO_EASE} 320ms both`,
      }}
    >
      <div
        className="flex h-11 shrink-0 items-end gap-4 border-b px-3.5"
        style={{ borderColor: RULE }}
      >
        <SideTab label={t.tabScene} />
        <SideTab label={t.tabDesign} />
        <SideTab label={t.tabPreview} active />
      </div>

      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="relative flex size-2">
            <span
              className="absolute inline-flex size-full animate-ping rounded-full opacity-50"
              style={{ backgroundColor: CORRECT_KEY.edge }}
            />
            <span
              className="relative inline-flex size-2 rounded-full"
              style={{ backgroundColor: CORRECT_KEY.edge }}
            />
          </span>
          <span
            className="text-[10.5px] font-semibold"
            style={{ color: PREVIEW_META }}
          >
            {t.livePreview}
          </span>
        </div>
        <span
          className="inline-flex items-center gap-1 text-[10.5px] font-semibold"
          style={{ color: PREVIEW_META }}
        >
          <RotateCcw size={10} strokeWidth={2.6} />
          {t.replay}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-2.5 pb-2.5 xl:px-3">
        <div
          className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[16px] border px-2 py-2.5"
          style={previewTrayStyle(PILLAR)}
        >
          <PhoneMock t={t} showBlock={showBlock} />
        </div>

        <div className="mt-2.5 flex items-center justify-center gap-2 pb-0.5">
          <Monitor
            size={13}
            strokeWidth={2.4}
            style={{ color: IDLE_KEY.edge }}
          />
          <Smartphone
            size={13}
            strokeWidth={2.4}
            style={{ color: PILLAR.accentColor }}
          />
          <span
            className="text-[10px] font-semibold"
            style={{ color: PREVIEW_META }}
          >
            {t.deviceLabel}
          </span>
        </div>
      </div>
    </aside>
  );
}

function SideTab({ label, active }: { label: string; active?: boolean }) {
  return (
    <div
      className="relative pb-2.5 text-[11.5px] font-bold"
      style={active ? { color: PILLAR.accentColor } : { color: PREVIEW_META }}
    >
      {label}
      {active ? (
        <span
          className="absolute inset-x-0 bottom-0 h-[2px] rounded-full"
          style={{ backgroundColor: PILLAR.accentColor }}
          aria-hidden
        />
      ) : null}
    </div>
  );
}
