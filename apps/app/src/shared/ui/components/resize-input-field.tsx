"use client";

import { Input, type InputProps } from "@scibly/ui/components/input";
import { cn } from "@scibly/ui/utils";
import { forwardRef, useLayoutEffect, useRef } from "react";

type ResizeInputFieldProps = InputProps & {
  wrapperClassName?: string;

  minWidthPx?: number;
};

export const WIDTH_BUFFER_PX = 4;

export const ResizeInputField = forwardRef<
  HTMLInputElement,
  ResizeInputFieldProps
>(
  (
    { wrapperClassName, className, value, placeholder, minWidthPx, ...props },
    ref,
  ) => {
    const spanRef = useRef<HTMLSpanElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const setInputRef = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    const measureText =
      typeof value === "string" && value.length > 0
        ? value
        : minWidthPx !== undefined
          ? ""
          : (placeholder ?? "");

    useLayoutEffect(() => {
      const input = inputRef.current;
      const mirror = spanRef.current;
      if (!input || !mirror) return;

      const measured = mirror.offsetWidth + WIDTH_BUFFER_PX;
      const nextWidth =
        minWidthPx !== undefined
          ? Math.max(minWidthPx, measured)
          : measured > 0
            ? measured
            : minWidthPx;

      if (nextWidth !== undefined) {
        input.style.width = `${nextWidth}px`;
      }
    }, [minWidthPx, value, placeholder, className]);

    return (
      <span
        className={cn("relative inline-block max-w-full", wrapperClassName)}
      >
        <span
          ref={spanRef}
          aria-hidden
          className={cn(
            "pointer-events-none invisible absolute top-0 left-0 px-2 whitespace-pre",
            className,
          )}
        >
          {measureText || "\u00a0"}
        </span>
        <Input
          {...props}
          value={value}
          placeholder={placeholder}
          ref={setInputRef}
          type="text"
          className={cn("px-2", className)}
        />
      </span>
    );
  },
);

ResizeInputField.displayName = "ResizeInputField";

export default ResizeInputField;
