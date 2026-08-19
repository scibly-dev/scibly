"use client";

import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import type { Ref } from "react";

import { cn } from "@scibly/ui/utils";

import { resolveAspectRatioStyle } from "../../infographic/resolve-aspect-ratio-style";

interface GeneratedImagePreviewFrameProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "style"
> {
  ref?: Ref<HTMLDivElement>;
  width?: number;
  height?: number;
  aspectRatio?: string;
  fallbackAspectRatio?: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}

export function GeneratedImagePreviewFrame({
  ref,
  width,
  height,
  aspectRatio,
  fallbackAspectRatio,
  className,
  style,
  children,
  ...props
}: GeneratedImagePreviewFrameProps) {
  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden rounded-[28px]", className)}
      style={{
        aspectRatio: resolveAspectRatioStyle({
          width,
          height,
          aspectRatio,
          fallback: fallbackAspectRatio,
        }),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
