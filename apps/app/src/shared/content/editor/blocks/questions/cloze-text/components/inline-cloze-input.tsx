"use client";

import { cn } from "@scibly/ui/utils";
import { forwardRef, memo, useCallback, useLayoutEffect, useRef } from "react";

type InlineClozeTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;

  minWidthPx?: number;

  measurePlaceholder?: boolean;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
};

const DEFAULT_MIN_WIDTH_PX = 56;

export const WIDTH_BUFFER_PX = 4;

const FIELD_CLASSNAME =
  "caret-current m-0 inline-block min-w-[1ch] border-none bg-transparent p-0 align-baseline text-inherit font-[inherit] leading-[inherit] text-neutral-900 placeholder:text-neutral-400/80 focus:outline-none focus:ring-0 dark:text-neutral-100 dark:placeholder:text-neutral-500/80";

export const InlineClozeTextInput = memo(
  forwardRef<HTMLInputElement, InlineClozeTextInputProps>((props, ref) => {
    const {
      value,
      onChange,
      placeholder,
      className,
      minWidthPx = DEFAULT_MIN_WIDTH_PX,
      measurePlaceholder = true,
      onKeyDown,
    } = props;

    const mirrorRef = useRef<HTMLSpanElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    useLayoutEffect(() => {
      const input = inputRef.current;
      const mirror = mirrorRef.current;
      if (!input || !mirror) return;
      input.style.width = `${Math.max(mirror.offsetWidth + WIDTH_BUFFER_PX, minWidthPx)}px`;
    }, [measurePlaceholder, minWidthPx, value, placeholder]);

    const mirrorContent =
      value.length > 0
        ? value
        : measurePlaceholder
          ? placeholder || "\u00a0"
          : "\u00a0";

    return (
      <span
        className={cn(
          "relative inline-block max-w-full align-baseline",
          className,
        )}
      >
        <span
          ref={mirrorRef}
          aria-hidden
          className="invisible absolute px-0 font-[inherit] whitespace-pre text-inherit"
        >
          {mirrorContent}
        </span>
        <input
          ref={setInputRef}
          type="text"
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          className={FIELD_CLASSNAME}
        />
      </span>
    );
  }),
);
InlineClozeTextInput.displayName = "InlineClozeTextInput";
