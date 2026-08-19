"use client";

import { cn } from "@scibly/ui/utils";
import { Plus, Trash2 } from "lucide-react";

import {
  uxCardDetailInputClass,
  uxCardFeedbackInputClass,
  uxCardRowSurface,
  uxCardTitleInputClass,
} from "../shared/ux-card-row";

interface PlanningHeaderProps {
  title: string;
  summary?: string;
}

export function PlanningHeader({ title, summary }: PlanningHeaderProps) {
  return (
    <div className="px-5 pt-5 pb-4">
      <p className="text-ink text-[15px] leading-snug font-semibold tracking-tight dark:text-neutral-50">
        {title}
      </p>
      {summary?.trim() && (
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
          {summary.trim()}
        </p>
      )}
    </div>
  );
}

interface PlanningStepBadgeProps {
  index: number;
}

function planningStepBadge({ index }: PlanningStepBadgeProps) {
  return (
    <span
      className={cn(
        "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px]",
        "bg-neutral-100 text-[11px] font-semibold text-neutral-600 tabular-nums",
        "dark:bg-neutral-800 dark:text-neutral-300",
      )}
    >
      {index}
    </span>
  );
}

interface PlanningStepRowProps {
  index: number;
  title: string;
  detail: string;
  titleLabel: string;
  detailPlaceholder: string;
  removeLabel: string;
  disabled?: boolean;
  onTitleChange: (value: string) => void;
  onDetailChange: (value: string) => void;
  onRemove: () => void;
}

export function PlanningStepRow({
  index,
  title,
  detail,
  titleLabel,
  detailPlaceholder,
  removeLabel,
  disabled,
  onTitleChange,
  onDetailChange,
  onRemove,
}: PlanningStepRowProps) {
  return (
    <div className={cn(uxCardRowSurface, "group/step items-start")}>
      {planningStepBadge({ index })}
      <div className="min-w-0 flex-1 space-y-2">
        <input
          type="text"
          value={title}
          disabled={disabled}
          aria-label={titleLabel}
          onChange={(event) => onTitleChange(event.target.value)}
          className={uxCardTitleInputClass}
        />
        <textarea
          value={detail}
          disabled={disabled}
          rows={2}
          placeholder={detailPlaceholder}
          onChange={(event) => onDetailChange(event.target.value)}
          className={uxCardDetailInputClass}
        />
      </div>
      <button
        type="button"
        disabled={disabled}
        aria-label={removeLabel}
        onClick={onRemove}
        className={cn(
          "mt-0.5 rounded-lg p-1.5 text-neutral-400 opacity-0 transition-all",
          "group-hover/step:opacity-100",
          "hover:bg-neutral-200/70 hover:text-neutral-700",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
        )}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

interface PlanningAddStepRowProps {
  title: string;
  detail: string;
  titlePlaceholder: string;
  detailPlaceholder: string;
  addStepAriaLabel: string;
  disabled?: boolean;
  atLimit: boolean;
  limitLabel: string;
  onTitleChange: (value: string) => void;
  onDetailChange: (value: string) => void;
  onAdd: () => void;
}

export function PlanningAddStepRow({
  title,
  detail,
  titlePlaceholder,
  detailPlaceholder,
  addStepAriaLabel,
  disabled,
  atLimit,
  limitLabel,
  onTitleChange,
  onDetailChange,
  onAdd,
}: PlanningAddStepRowProps) {
  if (atLimit) {
    return (
      <p className="px-4 py-2 text-[13px] text-neutral-400 dark:text-neutral-500">
        {limitLabel}
      </p>
    );
  }

  const canAdd = title.trim().length > 0;

  return (
    <div className={cn(uxCardRowSurface, "items-start")}>
      <span
        className={cn(
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border",
          "border-neutral-300 bg-white text-neutral-500",
          "dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-400",
        )}
      >
        <Plus className="h-3 w-3" strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <input
          type="text"
          value={title}
          disabled={disabled}
          placeholder={titlePlaceholder}
          onChange={(event) => onTitleChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && canAdd) {
              event.preventDefault();
              onAdd();
            }
          }}
          className={uxCardTitleInputClass}
        />
        <textarea
          value={detail}
          disabled={disabled}
          rows={2}
          placeholder={detailPlaceholder}
          onChange={(event) => onDetailChange(event.target.value)}
          className={uxCardDetailInputClass}
        />
      </div>
      <button
        type="button"
        disabled={disabled || !canAdd}
        aria-label={addStepAriaLabel}
        onClick={onAdd}
        className={cn(
          "mt-0.5 rounded-lg p-1.5 text-neutral-500 transition-colors",
          "hover:bg-neutral-200/70 hover:text-neutral-700",
          "disabled:cursor-not-allowed disabled:opacity-40",
          "dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200",
        )}
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

interface PlanningFeedbackFieldProps {
  label: string;
  placeholder: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function PlanningFeedbackField({
  label,
  placeholder,
  value,
  disabled,
  onChange,
}: PlanningFeedbackFieldProps) {
  return (
    <div className="px-4 pb-3">
      <label className="mb-2 block text-[13px] font-medium text-neutral-600 dark:text-neutral-300">
        {label}
      </label>
      <textarea
        value={value}
        disabled={disabled}
        rows={3}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={uxCardFeedbackInputClass}
      />
    </div>
  );
}
