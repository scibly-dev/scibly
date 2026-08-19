"use client";

import { forwardRef, memo } from "react";

import { InlineClozeTextInput } from "@/shared/content/editor/blocks/questions/cloze-text/components/inline-cloze-input";

const EMPTY_GAP_MIN_WIDTH_PX = 88;

type AuthorGapInlineProps = {
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  removeLabel?: string;
};

export const AuthorGapInline = memo(
  forwardRef<HTMLInputElement, AuthorGapInlineProps>((props, ref) => {
    const {
      value,
      onChange,
      onRemove,
      onKeyDown,
      placeholder,
      removeLabel = "Remove gap",
    } = props;

    return (
      <span className="group/gap relative inline-flex max-w-full items-baseline align-baseline">
        <span className="inline-flex items-baseline border-b-2 border-dashed border-blue-500/45 pb-0.5 dark:border-blue-400/35">
          <InlineClozeTextInput
            ref={ref}
            value={value}
            onChange={onChange}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            minWidthPx={EMPTY_GAP_MIN_WIDTH_PX}
            measurePlaceholder={value.length > 0}
            className="text-center font-semibold text-blue-700 dark:text-blue-300"
          />
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="ml-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-neutral-400 opacity-0 transition-opacity group-hover/gap:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
        >
          ×
        </button>
      </span>
    );
  }),
);
AuthorGapInline.displayName = "AuthorGapInline";
