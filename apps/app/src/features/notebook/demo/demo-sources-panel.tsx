"use client";

import type { ShowcaseSource } from "@scibly/showcase";
import type { NotebookTranslations } from "@/features/notebook/i18n/notebook.types";

import Icon from "@scibly/ui/components/icon";
import { cn } from "@scibly/ui/utils";

import { SourcesPanelView } from "@/features/notebook/sources/components/sources-panel-view";
import { StatusBadge } from "@/features/notebook/workspace/components/status-badge";
import { getSourceDisplayConfig } from "@/features/notebook/workspace/utils/constants";

import { useShowcaseSnapshot } from "./showcase-runtime";

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const DemoSourceCardComponent = ({
  source,
  t,
}: {
  source: ShowcaseSource;
  t: NotebookTranslations["sources"];
}) => {
  const { icon, theme } = getSourceDisplayConfig(source.type);
  return (
    <div className="relative flex items-start justify-between gap-3 rounded-xl border border-neutral-100 bg-white p-4 dark:border-neutral-800/40 dark:bg-neutral-950/40">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className={cn("mt-0.5 shrink-0 rounded-lg border p-2", theme)}>
          <Icon name={icon} className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="truncate text-xs font-semibold text-neutral-700 dark:text-neutral-200">
            {source.name}
          </span>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
            {source.type}
            {source.fileSize ? ` • ${formatFileSize(source.fileSize)}` : ""}
          </p>
        </div>
      </div>
      <StatusBadge status={source.status} label={t.statusReady} />
    </div>
  );
};

export function DemoSourcesPanel({ t }: { t: NotebookTranslations }) {
  const { sources } = useShowcaseSnapshot();
  const disabledHint = t.studio.courseBuilder.demoLimitationsBanner;

  return (
    <SourcesPanelView
      t={t}
      sources={sources}
      isLoading={false}
      uploadsDisabled
      uploadsDisabledHint={disabledHint}
      onFilesSelected={() => undefined}
      renderSource={(source) => (
        <DemoSourceCardComponent
          key={source.id}
          source={source}
          t={t.sources}
        />
      )}
    />
  );
}
