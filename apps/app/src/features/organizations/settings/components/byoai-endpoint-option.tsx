import type { OrgSettingsPage } from "../i18n/org-settings.types";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@scibly/ui/components/dropdown-menu";
import { cn } from "@scibly/ui/utils";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

interface ByoaiEndpointOptionProps {
  id: string;
  name: string;
  subtitle?: string;
  isSelected: boolean;
  isDisabled?: boolean;

  isSelectLocked?: boolean;
  isManaged?: boolean;
  healthStatus?: "OK" | "FAILED" | null;
  radioGroupName: string;
  t: OrgSettingsPage["aiConfig"];
  onSelect: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function HealthIndicatorComponent({
  status,
  t,
}: {
  status?: "OK" | "FAILED" | null;
  t: OrgSettingsPage["aiConfig"];
}) {
  if (status === "OK") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400"
        title={t.healthOk}
      >
        <span
          aria-hidden="true"
          className="h-1 w-1 rounded-full bg-emerald-500"
        />
        {t.healthOkShort}
      </span>
    );
  }

  if (status === "FAILED") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:text-red-400"
        title={t.healthFailed}
      >
        <span aria-hidden="true" className="h-1 w-1 rounded-full bg-red-500" />
        {t.healthFailedShort}
      </span>
    );
  }

  return null;
}

export function ByoaiOptionList({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200/80 dark:border-neutral-800/80">
      <div className="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
        {children}
      </div>
    </div>
  );
}

export const EndpointActions = ({
  name,
  t,
  onEdit,
  onDelete,
}: Pick<ByoaiEndpointOptionProps, "name" | "t" | "onEdit" | "onDelete">) => (
  <div className="flex shrink-0 items-center opacity-100 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "rounded-lg p-1.5 text-neutral-400 transition-colors",
            "hover:bg-neutral-100 hover:text-neutral-700",
            "focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:outline-none",
            "dark:hover:bg-neutral-800 dark:hover:text-neutral-300",
          )}
          aria-label={`${t.endpointActionsLabel} ${name}`}
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {onEdit ? (
          <DropdownMenuItem onClick={onEdit} className="gap-2">
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            {t.editButton}
          </DropdownMenuItem>
        ) : null}
        {onDelete ? (
          <DropdownMenuItem
            onClick={onDelete}
            className="gap-2 text-red-600 focus:text-red-600 dark:text-red-400"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t.removeButton}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
);

export function ByoaiEndpointOption({
  id,
  name,
  subtitle,
  isSelected,
  isDisabled = false,
  isSelectLocked = false,
  isManaged = false,
  healthStatus,
  radioGroupName,
  t,
  onSelect,
  onEdit,
  onDelete,
}: ByoaiEndpointOptionProps) {
  const hasActions = !isManaged && (onEdit || onDelete);
  const selectDisabled = isDisabled || isSelectLocked;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 px-4 py-3 transition-colors",
        isSelected
          ? "bg-neutral-50 dark:bg-neutral-900/50"
          : "hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30",
        isDisabled && "pointer-events-none opacity-60",
      )}
    >
      {isSelected ? (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 w-0.5 bg-neutral-900 dark:bg-neutral-100"
        />
      ) : null}

      <label
        htmlFor={id}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3",
          selectDisabled ? "cursor-default" : "cursor-pointer",
        )}
      >
        <input
          id={id}
          type="radio"
          name={radioGroupName}
          checked={isSelected}
          disabled={selectDisabled}
          onChange={onSelect}
          className="h-4 w-4 shrink-0 accent-neutral-900 disabled:opacity-50 dark:accent-neutral-100"
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-100">
              {name}
            </span>
            {isManaged ? (
              <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                {t.managedBadge}
              </span>
            ) : null}
            {!isManaged ? (
              <HealthIndicatorComponent status={healthStatus} t={t} />
            ) : null}
          </span>
          {subtitle ? (
            <span className="mt-0.5 block truncate text-[12px] text-neutral-500 dark:text-neutral-400">
              {subtitle}
            </span>
          ) : null}
        </span>
      </label>

      {hasActions ? (
        <EndpointActions
          name={name}
          t={t}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ) : null}
    </div>
  );
}
