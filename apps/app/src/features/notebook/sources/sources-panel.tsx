"use client";

import type { IntegrationProviderId } from "@/features/integrations/contracts";
import type { RouterOutputs } from "@/shared/api/trpc/client";
import type { NotebookTranslations } from "../i18n/notebook.types";

import { PLAN_CATALOGUE } from "@scibly/ee-billing/plan-catalogue";
import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { api } from "@/shared/api/trpc/client";

import { useNotebookActions } from "../chat/runtime/context";
import { useCourseBuilderStore } from "../course-builder/course-builder-store";
import { invalidateCourseSceneState } from "../course-builder/hooks/invalidate-course-scene-state";
import { IntegrationButtons } from "./components/integration-buttons";
import { SourceListItem } from "./components/source-list-item";
import { SourcesPanelView } from "./components/sources-panel-view";
import { useNotebookSources } from "./hooks/use-notebook-sources";
import { IntegrationPagePicker } from "./integration-page-picker";
import { PasteTextDialog } from "./paste-text-dialog";
import { reportSourceError } from "./report-source-error";
import { useSourceUploads } from "./use-source-uploads";

interface SourcesPanelProps {
  t: NotebookTranslations;
  notebookId: string | undefined;
  orgSlug: string;
}

function useNotebookSourceLimit(orgSlug: string): number | null {
  const { data } = api.billing.getStatus.useQuery(
    { orgSlug },
    { enabled: Boolean(orgSlug) },
  );
  return data?.plan ? PLAN_CATALOGUE[data.plan].sourcesPerNotebook : null;
}

function useIntegrationPicker(
  sources: RouterOutputs["notebook"]["source"]["list"],
  orgSlug: string,
  atLimit: boolean,
  ensureNotebook: () => Promise<string>,
) {
  const [pickerState, setPickerState] = useState<{
    provider: IntegrationProviderId;
    notebookId: string;
  } | null>(null);
  const { data } = api.integration.list.useQuery(
    { orgSlug },
    { enabled: Boolean(orgSlug) },
  );
  const connections = data?.connections ?? [];
  const activeConnection = pickerState
    ? connections.find(
        (connection) => connection.provider === pickerState.provider,
      )
    : undefined;
  const linkedIds = useMemo(() => {
    if (!pickerState) return new Set<string>();
    const prefix = pickerState.provider.toUpperCase();
    return new Set(
      sources.flatMap((source) =>
        source.externalId && source.type.startsWith(prefix)
          ? [source.externalId]
          : [],
      ),
    );
  }, [pickerState, sources]);
  const open = (provider: IntegrationProviderId) => {
    if (atLimit) return;
    void ensureNotebook().then((notebookId) =>
      setPickerState({ provider, notebookId }),
    );
  };
  return {
    pickerState,
    setPickerState,
    connections,
    activeConnection,
    linkedIds,
    open,
  };
}

interface SourcesPanelPresentationProps {
  t: NotebookTranslations;
  sources: RouterOutputs["notebook"]["source"]["list"];
  isLoading: boolean;
  disabled: boolean;
  disabledHint: string | undefined;

  sourceLimit: number | null;
  orgSlug: string;
  onFilesSelected: (files: FileList) => void;
  invalidate: () => void;
  pasteOpen: boolean;
  setPasteOpen: (open: boolean) => void;
  ensureNotebook: () => Promise<string>;
  addText: ReturnType<typeof api.notebook.source.addText.useMutation>;
  picker: ReturnType<typeof useIntegrationPicker>;
}

export const SourcesPanelPresentation = (
  props: SourcesPanelPresentationProps,
) => {
  return (
    <SourcesPanelView
      t={props.t}
      sources={props.sources}
      isLoading={props.isLoading}
      uploadsDisabled={props.disabled}
      uploadsDisabledHint={props.disabledHint}
      onFilesSelected={props.onFilesSelected}
      renderSource={(item) => (
        <SourceListItem
          key={item.id}
          item={item}
          orgSlug={props.orgSlug}
          t={props.t.sources}
          onDeleted={props.invalidate}
          onIngestionSettled={props.invalidate}
          onSourceReplaced={props.invalidate}
        />
      )}
      footer={
        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              if (!props.disabled) props.setPasteOpen(true);
            }}
            disabled={props.disabled}
            title={props.disabled ? props.disabledHint : undefined}
            className="text-muted-foreground hover:text-foreground flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-200 py-3 text-xs font-medium transition-all hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{props.t.sources.pasteText}</span>
          </button>
          <IntegrationButtons
            connectedProviders={props.picker.connections}
            t={props.t.sources}
            onPickerOpen={props.picker.open}
            disabled={props.disabled}
          />
        </div>
      }
      dialogs={
        <>
          <PasteTextDialog
            t={props.t}
            open={props.pasteOpen}
            onOpenChange={props.setPasteOpen}
            onSubmit={(name, content) => {
              void props
                .ensureNotebook()
                .then((notebookId) =>
                  props.addText.mutate({ notebookId, name, content }),
                );
            }}
            isLoading={props.addText.isPending}
            disabled={props.disabled}
          />
          {props.picker.pickerState &&
          props.picker.activeConnection &&
          props.sourceLimit !== null ? (
            <IntegrationPagePicker
              open
              onOpenChange={(open) => {
                if (!open) props.picker.setPickerState(null);
              }}
              notebookId={props.picker.pickerState.notebookId}
              orgSlug={props.orgSlug}
              provider={props.picker.pickerState.provider}
              totalSourceCount={props.sources.length}
              sourceLimit={props.sourceLimit}
              alreadyLinkedIds={props.picker.linkedIds}
              t={props.t.sources.pagePicker}
              onLinked={props.invalidate}
            />
          ) : null}
        </>
      }
    />
  );
};

export function SourcesPanel({ t, notebookId, orgSlug }: SourcesPanelProps) {
  const { ensureNotebook } = useNotebookActions();

  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);

  const utils = api.useUtils();
  const courseId = useCourseBuilderStore((s) => s.course?.id);

  const { data: notebookMeta } = api.notebook.getMeta.useQuery(
    { orgSlug, notebookId: notebookId! },
    { enabled: !!notebookId },
  );
  const effectiveCourseId = courseId ?? notebookMeta?.courseId ?? undefined;

  const invalidateSourcesAndScenes = useCallback(() => {
    if (!notebookId) return;
    void utils.notebook.source.list.invalidate({ notebookId });
    invalidateCourseSceneState(utils, {
      courseId: effectiveCourseId,
      allLessons: true,
    });

    void utils.billing.getGenerationBalance.invalidate({ orgSlug });
  }, [utils, effectiveCourseId, notebookId, orgSlug]);

  const { data: sources = [], isLoading } = useNotebookSources(notebookId);

  const addTextMutation = api.notebook.source.addText.useMutation({
    onSuccess: () => {
      invalidateSourcesAndScenes();
      setPasteDialogOpen(false);
    },
    onError: (error) =>
      reportSourceError(
        "[SourcesPanel] Add text failed:",
        error,
        t.sources.entitlement,
      ),
  });

  const sourceLimit = useNotebookSourceLimit(orgSlug);
  const atSourceLimit = sourceLimit !== null && sources.length >= sourceLimit;

  const uploadsDisabled = sourceLimit === null || atSourceLimit;
  const uploadsDisabledHint = atSourceLimit
    ? t.sources.sourceLimitReached.replace("{max}", String(sourceLimit))
    : undefined;

  const handleFilesSelected = useSourceUploads({
    atLimit: uploadsDisabled,
    entitlementCopy: t.sources.entitlement,
    ensureNotebook,
    onSettled: invalidateSourcesAndScenes,
  });

  const picker = useIntegrationPicker(
    sources,
    orgSlug,
    uploadsDisabled,
    ensureNotebook,
  );

  return (
    <SourcesPanelPresentation
      t={t}
      sources={sources}
      isLoading={isLoading}
      disabled={uploadsDisabled}
      disabledHint={uploadsDisabledHint}
      sourceLimit={sourceLimit}
      orgSlug={orgSlug}
      onFilesSelected={handleFilesSelected}
      invalidate={invalidateSourcesAndScenes}
      pasteOpen={pasteDialogOpen}
      setPasteOpen={setPasteDialogOpen}
      ensureNotebook={ensureNotebook}
      addText={addTextMutation}
      picker={picker}
    />
  );
}
