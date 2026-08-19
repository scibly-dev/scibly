"use client";

import type { RouterOutputs } from "@/shared/api/trpc/client";
import type { SourceStatus } from "@/shared/content/sources/constants";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { NotionLogoIcon } from "@radix-ui/react-icons";
import Icon from "@scibly/ui/components/icon";
import { cn } from "@scibly/ui/utils";
import { useRef, useState } from "react";

import { api } from "@/shared/api/trpc/client";
import {
  EXTENSION_TO_SOURCE_TYPE,
  isSourceIngesting,
} from "@/shared/content/sources/constants";

import { getSourceDisplayConfig } from "../../workspace/utils/constants";
import { reportSourceError } from "../report-source-error";
import { uploadSourceFile } from "../use-source-uploads";
import { SourceListItemActions } from "./source-list-item-actions";

type Source = RouterOutputs["notebook"]["source"]["list"][number];

interface SourceListItemProps {
  item: Source;
  orgSlug: string;
  t: NotebookTranslations["sources"];
  onDeleted: () => void;
  onIngestionSettled?: () => void;
  onSourceReplaced?: () => void;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sourceIngestNotice({
  message,
  variant,
}: {
  message: string;
  variant: "error" | "warning";
}) {
  return (
    <p
      className={cn(
        "mt-3 rounded-lg px-3 py-2.5 text-[10px] leading-relaxed wrap-break-word",
        variant === "error"
          ? "border border-red-200/80 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
          : "border border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100",
      )}
    >
      {message}
    </p>
  );
}

export const SourceCardDetails = ({
  item,
  icon,
  theme,
}: {
  item: Source;
  icon: React.ComponentProps<typeof Icon>["name"];
  theme: string;
}) => {
  return (
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <div className={cn("mt-0.5 shrink-0 rounded-lg border p-2", theme)}>
        {item.type.toLowerCase() === "notion_page" ? (
          <NotionLogoIcon className="h-4 w-4" />
        ) : (
          <Icon name={icon} className="h-4 w-4" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="pr-24">
          <span className="truncate text-xs font-semibold text-neutral-700 dark:text-neutral-200">
            {item.name}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
              {item.type}
              {item.fileSize ? ` • ${formatFileSize(item.fileSize)}` : ""}
            </span>
          </div>
        </div>
        {item.status === "FAILED" && item.error
          ? sourceIngestNotice({ message: item.error, variant: "error" })
          : null}
        {item.status === "READY" && item.warning
          ? sourceIngestNotice({ message: item.warning, variant: "warning" })
          : null}
      </div>
    </div>
  );
};

function useReplaceSource(
  item: Source,
  t: NotebookTranslations["sources"],
  onSourceReplaced?: () => void,
) {
  const replace = api.notebook.source.replaceUpload.useMutation({
    onError: (error) =>
      reportSourceError(
        "[SourceListItem] Replace upload failed:",
        error,
        t.entitlement,
      ),
  });
  const confirm = api.notebook.source.confirmReplaceUpload.useMutation({
    onSuccess: onSourceReplaced,
    onError: (error) =>
      reportSourceError(
        "[SourceListItem] Replace upload failed:",
        error,
        t.entitlement,
      ),
  });

  const [isUploading, setIsUploading] = useState(false);
  const handleReplaceFile = async (file: File) => {
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    const sourceType = EXTENSION_TO_SOURCE_TYPE.get(ext);
    if (!sourceType) return;
    const replacement = {
      sourceId: item.id,
      fileName: file.name,
      fileSize: file.size,
      sourceType,
    };
    replace.mutate(replacement, {
      onSuccess: async (data) => {
        setIsUploading(true);
        try {
          await uploadSourceFile(file, data.upload);
          confirm.mutate({ ...replacement, s3Key: data.s3Key });
        } catch (error) {
          console.error("[SourceListItem] S3 replace upload failed:", error);
        } finally {
          setIsUploading(false);
        }
      },
    });
  };
  return {
    handleReplaceFile,
    isReplacing: replace.isPending || isUploading || confirm.isPending,
  };
}

function useSourceActions(props: SourceListItemProps) {
  const retry = api.notebook.source.retryIngest.useMutation({
    onSuccess: props.onIngestionSettled,
    onError: (error) =>
      reportSourceError(
        "[SourceListItem] Retry failed:",
        error,
        props.t.entitlement,
      ),
  });
  const resync = api.integration.resyncSource.useMutation({
    onSuccess: props.onIngestionSettled,
    onError: (error) =>
      console.error("[SourceListItem] Re-sync failed:", error),
  });
  const download = api.notebook.source.getDownloadUrl.useMutation({
    onSuccess: ({ downloadUrl }) =>
      window.open(downloadUrl, "_blank", "noopener,noreferrer"),
    onError: (error) =>
      console.error("[SourceListItem] Download failed:", error),
  });
  const remove = api.notebook.source.delete.useMutation({
    onSuccess: props.onDeleted,
  });
  return {
    retry: () => retry.mutate({ sourceId: props.item.id }),
    resync: () =>
      resync.mutate({ sourceId: props.item.id, orgSlug: props.orgSlug }),
    download: () => download.mutate({ sourceId: props.item.id }),
    remove: () => remove.mutate({ sourceId: props.item.id }),
    isRetrying: retry.isPending && retry.variables?.sourceId === props.item.id,
    isResyncing:
      resync.isPending && resync.variables?.sourceId === props.item.id,
    isDownloading:
      download.isPending && download.variables?.sourceId === props.item.id,
  };
}

export function SourceListItem({
  item,
  orgSlug,
  t,
  onDeleted,
  onIngestionSettled,
  onSourceReplaced,
}: SourceListItemProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replacement = useReplaceSource(item, t, onSourceReplaced);
  const actions = useSourceActions({
    item,
    orgSlug,
    t,
    onDeleted,
    onIngestionSettled,
    onSourceReplaced,
  });

  const { icon, theme } = getSourceDisplayConfig(item.type);

  const isIngestInFlight =
    replacement.isReplacing || actions.isRetrying || actions.isResyncing;
  const status = isIngestInFlight ? "PROCESSING" : item.status;

  const isIngesting = isSourceIngesting(status);
  const isActivelyIngesting = isIngesting && !item.retryable;
  const canRetryIngest = !item.externalId && item.retryable;

  const statusLabels = {
    PENDING: t.statusPending,
    PROCESSING: t.statusProcessing,
    READY: t.statusReady,
    FAILED: t.statusFailed,
  } satisfies Record<SourceStatus, string>;

  return (
    <div className="group relative flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-neutral-100 bg-white p-4 transition-all hover:bg-neutral-50/50 dark:border-neutral-800/40 dark:bg-neutral-950/40 dark:hover:bg-neutral-900/30">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void replacement.handleReplaceFile(file);
          e.target.value = "";
        }}
      />
      <SourceCardDetails item={item} icon={icon} theme={theme} />

      <SourceListItemActions
        item={item}
        t={t}
        status={status}
        statusLabel={statusLabels[status] ?? status}
        canRetryIngest={canRetryIngest}
        isActivelyIngesting={isActivelyIngesting}
        isReplacing={replacement.isReplacing}
        isDownloading={actions.isDownloading}
        isRetrying={actions.isRetrying}
        isResyncing={actions.isResyncing}
        onReplace={() => fileInputRef.current?.click()}
        onDownload={actions.download}
        onRetry={actions.retry}
        onResync={actions.resync}
        onDelete={actions.remove}
      />
    </div>
  );
}
