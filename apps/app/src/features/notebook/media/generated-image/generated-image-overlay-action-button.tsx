"use client";

import type { GeneratedImageOverlayVariant } from "./generated-image-types";

import { type ReactNode } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/components/tooltip";

import { overlayButtonClassNames } from "./overlay-button-class-names";

interface GeneratedImageOverlayActionButtonProps {
  label: string;
  onClick?: () => void;
  href?: string;
  isLoading?: boolean;
  variant: GeneratedImageOverlayVariant;
  children: ReactNode;
}

export function GeneratedImageOverlayActionButton({
  label,
  onClick,
  href,
  isLoading,
  variant,
  children,
}: GeneratedImageOverlayActionButtonProps) {
  const buttonClassName = overlayButtonClassNames[variant];

  const trigger = href ? (
    <a
      aria-label={label}
      className={buttonClassName}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  ) : (
    <button
      aria-busy={isLoading}
      aria-label={label}
      className={buttonClassName}
      disabled={isLoading}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side={variant === "library" ? "left" : "bottom"}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
