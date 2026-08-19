"use client";

import { cn } from "@scibly/ui/utils";
import * as React from "react";

const DEFAULT_MAX_HEIGHT = 200;
const DEFAULT_SINGLE_LINE_THRESHOLD = 60;

interface AutosizeTextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "style"
> {
  maxHeight?: number;

  onMultiLineChange?: (isMultiLine: boolean) => void;

  singleLineThreshold?: number;
}

const AutosizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutosizeTextareaProps
>(
  (
    {
      className,
      maxHeight = DEFAULT_MAX_HEIGHT,
      onChange,
      onMultiLineChange,
      singleLineThreshold = DEFAULT_SINGLE_LINE_THRESHOLD,
      value,
      ...props
    },
    ref,
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement | null>(null);
    const isMultiLineRef = React.useRef(false);
    const onMultiLineChangeRef = React.useRef(onMultiLineChange);
    onMultiLineChangeRef.current = onMultiLineChange;

    const mergedRef = React.useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref],
    );

    const resize = React.useCallback(() => {
      const el = internalRef.current;
      if (!el) return;

      el.style.height = "auto";
      const scrollH = el.scrollHeight;
      const clamped = Math.min(scrollH, maxHeight);
      el.style.height = `${clamped}px`;
      el.style.overflow = scrollH > maxHeight ? "auto" : "hidden";

      const text = typeof value === "string" ? value : "";
      const hasNewlines = text.includes("\n");

      let nextMultiLine: boolean;
      if (text.length === 0) {
        nextMultiLine = false;
      } else if (!isMultiLineRef.current) {
        nextMultiLine = hasNewlines || scrollH > singleLineThreshold;
      } else {
        nextMultiLine = hasNewlines || scrollH > singleLineThreshold - 10;
      }

      if (nextMultiLine !== isMultiLineRef.current) {
        isMultiLineRef.current = nextMultiLine;
        onMultiLineChangeRef.current?.(nextMultiLine);
      }
    }, [value, maxHeight, singleLineThreshold]);

    React.useLayoutEffect(() => {
      resize();
    }, [resize]);

    React.useEffect(() => {
      const el = internalRef.current;
      if (!el) return;

      const observer = new ResizeObserver(() => {
        resize();
      });

      observer.observe(el);
      return () => observer.disconnect();
    }, [resize]);

    return (
      <textarea
        className={cn("resize-none", className)}
        onChange={onChange}
        ref={mergedRef}
        rows={1}
        value={value}
        {...props}
      />
    );
  },
);

AutosizeTextarea.displayName = "AutosizeTextarea";

export { AutosizeTextarea };
