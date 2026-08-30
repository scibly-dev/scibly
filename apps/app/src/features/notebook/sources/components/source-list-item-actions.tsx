"use client";

import type { ReactElement } from "react";
import type { RouterOutputs } from "@/shared/api/trpc/client";
import type { NotebookTranslations } from "../../i18n/notebook.types";

import { httpsUrl } from "@scibly/schemas/common";
import {
  Download,
  ExternalLink,
  FileUp,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";

import { type SourceStatus } from "@/shared/content/sources/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/components/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/components/tooltip";

import { StatusBadge } from "../../workspace/components/status-badge";

type Source = RouterOutputs["notebook"]["source"]["list"][number];

interface SourceListItemActionsProps {
  item: Pick<
    Source,
    "id" | "name" | "status" | "url" | "externalId" | "externalUrl"
  >;
  t: NotebookTranslations["sources"];

  status: SourceStatus;
  statusLabel: string;
  canRetryIngest: boolean;
  isActivelyIngesting: boolean;
  isReplacing: boolean;
  isDownloading: boolean;
  isRetrying: boolean;
  isResyncing: boolean;
  onReplace: () => void;
  onDownload: () => void;
  onRetry: () => void;
  onResync: () => void;
  onDelete: () => void;
}

export function SourceActionTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}

const actionButtonClass =
  "rounded-md p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300";
const deleteButtonClass =
  "rounded-md p-2 text-neutral-400 hover:bg-red-50 hover:text-red-500 dark:text-neutral-500 dark:hover:bg-red-950/50 dark:hover:text-red-400";

export const SourceIconButton = ({
  visible,
  label,
  loading,
  disabled,
  icon,
  onClick,
}: {
  visible: boolean;
  label: string;
  loading: boolean;
  disabled?: boolean;
  icon: ReactElement;
  onClick: () => void;
}) => {
  if (!visible) return null;
  return (
    <SourceActionTooltip label={label}>
      <button
        onClick={(event) => {
          event.stopPropagation();
          onClick();
        }}
        disabled={disabled || loading}
        type="button"
        className={actionButtonClass}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      </button>
    </SourceActionTooltip>
  );
};

export const DeleteSourceAction = ({
  item,
  t,
  onDelete,
}: Pick<SourceListItemActionsProps, "item" | "t" | "onDelete">) => {
  return (
    <AlertDialog>
      <SourceActionTooltip label={t.deleteSource}>
        <AlertDialogTrigger asChild>
          <button
            onClick={(event) => event.stopPropagation()}
            type="button"
            className={deleteButtonClass}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </AlertDialogTrigger>
      </SourceActionTooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.deleteConfirmDescription.replace("{{name}}", item.name)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t.cancelButton}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onDelete}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          >
            {t.deleteConfirmButton}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export function SourceListItemActions({
  item,
  t,
  status,
  statusLabel,
  canRetryIngest,
  isActivelyIngesting,
  isReplacing,
  isDownloading,
  isRetrying,
  isResyncing,
  onReplace,
  onDownload,
  onRetry,
  onResync,
  onDelete,
}: SourceListItemActionsProps) {
  // Rows stored before the link schemas were tightened were never protocol-checked, so a `javascript:` url may already be in the database.
  const externalHref = httpsUrl().safeParse(item.externalUrl).success
    ? item.externalUrl
    : null;

  return (
    <div className="absolute top-4 right-4">
      <div className="transition-opacity duration-150 group-hover:pointer-events-none group-hover:opacity-0">
        <StatusBadge status={status} label={statusLabel} />
      </div>

      <TooltipProvider delayDuration={0}>
        <div className="absolute top-0 right-0 flex items-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <SourceIconButton
            visible={
              !item.externalId && Boolean(item.url) && item.status === "READY"
            }
            label={t.replaceFile}
            loading={isReplacing}
            icon={<FileUp className="h-3.5 w-3.5" />}
            onClick={onReplace}
          />
          <SourceIconButton
            visible={Boolean(item.url)}
            label={t.downloadFile}
            loading={isDownloading}
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={onDownload}
          />
          <SourceIconButton
            visible={canRetryIngest}
            label={t.retrySource}
            loading={isRetrying}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={onRetry}
          />

          {externalHref ? (
            <SourceActionTooltip label={t.openExternal}>
              <a
                href={externalHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
                className={actionButtonClass}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </SourceActionTooltip>
          ) : null}

          <SourceIconButton
            visible={Boolean(item.externalId)}
            label={t.resyncSource}
            loading={isResyncing}
            disabled={isActivelyIngesting}
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            onClick={onResync}
          />
          <DeleteSourceAction item={item} t={t} onDelete={onDelete} />
        </div>
      </TooltipProvider>
    </div>
  );
}
