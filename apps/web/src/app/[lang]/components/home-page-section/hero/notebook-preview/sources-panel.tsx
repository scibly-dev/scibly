"use client";

import { motion } from "framer-motion";
import { type Ref } from "react";

import {
  CORRECT_KEY,
  IDLE_KEY,
} from "@/app/[lang]/components/marketing-tokens";

import { flatKey, PREVIEW_META } from "../hero-preview-kit";
import { type NotebookCopy } from "./notebook-copy";
import { EASE, PILLAR, RAIL, RULE, SELECTED } from "./notebook-theme";
import { type SourceKind, SourceTypeIcon } from "./source-glyphs";
import { StudioPanel } from "./studio-panel";

export type RightTab = "sources" | "studio";

export function SourcesPanel({
  t,
  tab,
  sourceHighlight,
  studioProgress,
  studioScenes,
  sourceOneRef,
  studioTabRef,
}: {
  t: NotebookCopy;
  tab: RightTab;
  sourceHighlight: boolean;
  studioProgress: number;
  studioScenes: number;
  sourceOneRef: Ref<HTMLDivElement>;
  studioTabRef: Ref<HTMLButtonElement>;
}) {
  return (
    <aside
      className="hidden w-[176px] shrink-0 flex-col border-l lg:flex xl:w-[188px]"
      style={{ backgroundColor: RAIL, borderColor: RULE }}
    >
      <div
        className="flex h-12 shrink-0 items-end gap-2.5 border-b px-2.5"
        style={{ borderColor: RULE }}
      >
        <SourcesTab label={t.tabSources} active={tab === "sources"} />
        <SourcesTab label={t.tabMedia} />
        <SourcesTab
          ref={studioTabRef}
          label={t.tabStudio}
          active={tab === "studio"}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {tab === "sources" ? (
          <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-2.5 py-3">
            <div className="mb-0.5 flex items-center justify-between px-0.5">
              <p
                className="m-0 text-[10.5px] font-semibold"
                style={{ color: PREVIEW_META }}
              >
                {t.sourcesLabel}
              </p>
              <span
                className="rounded-md border px-1.5 text-[10px] font-bold"
                style={flatKey(IDLE_KEY, 0)}
              >
                3
              </span>
            </div>
            <SourceRow
              ref={sourceOneRef}
              name={t.sourceOne}
              meta={t.sourceOneMeta}
              ready={t.sourceReady}
              kind="pdf"
              active={sourceHighlight}
            />
            <SourceRow
              name={t.sourceTwo}
              meta={t.sourceTwoMeta}
              ready={t.sourceReady}
              kind="notion"
            />
            <SourceRow
              name={t.sourceThree}
              meta={t.sourceThreeMeta}
              ready={t.sourceReady}
              kind="md"
            />
          </div>
        ) : (
          <StudioPanel
            t={t}
            progress={studioProgress}
            sceneCount={studioScenes}
          />
        )}
      </div>
    </aside>
  );
}

function SourceRow({
  name,
  meta,
  ready,
  kind,
  active,
  ref,
}: {
  name: string;
  meta: string;
  ready: string;
  kind: SourceKind;
  active?: boolean;
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <motion.div
      ref={ref}
      className="flex items-start gap-1.5 rounded-[11px] border px-2 py-1.5 transition-[background-color,border-color,box-shadow] duration-300"
      style={flatKey(active ? SELECTED : IDLE_KEY, active ? 3 : 2)}
      animate={active ? { scale: [1, 1.02, 1] } : { scale: 1 }}
      transition={{ duration: 0.4, ease: EASE }}
    >
      <SourceTypeIcon kind={kind} />
      <div className="min-w-0 flex-1">
        <p className="text-ink m-0 truncate text-left text-[10.5px] leading-snug font-bold">
          {name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1">
          <p
            className="m-0 truncate text-left text-[9px] font-medium"
            style={{ color: PREVIEW_META }}
          >
            {meta}
          </p>
          <span
            className="inline-flex items-center rounded-full border px-1 text-[8px] font-bold"
            style={flatKey(CORRECT_KEY, 0)}
          >
            {ready}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function SourcesTab({
  label,
  active,
  ref,
}: {
  label: string;
  active?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={-1}
      className="relative truncate pb-2.5 text-[10.5px] font-bold"
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
    </button>
  );
}
