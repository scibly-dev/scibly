"use client";

import type React from "react";

import { cn } from "@scibly/ui/utils";
import { ChevronLeft, Loader2 } from "lucide-react";

import { env } from "@/env";

const PRIMARY_BUTTON_CLASS =
  "ease-press h-14 w-full rounded-2xl text-sm font-extrabold tracking-[0.12em] uppercase transition-[translate,box-shadow,filter] duration-100 focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 focus-visible:outline-none";

interface PlayerPrimaryButtonProps {
  label: string;
  isEnabled: boolean;
  isLoading?: boolean;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function PlayerPrimaryButton({
  label,
  isEnabled,
  isLoading = false,
  onClick,
  className,
  style,
}: PlayerPrimaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isEnabled}
      aria-busy={isLoading}
      className={cn(
        PRIMARY_BUTTON_CLASS,
        "inline-flex items-center justify-center gap-2",
        className,
      )}
      style={style}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : null}
      {label}
    </button>
  );
}

const SECONDARY_BUTTON_CLASS =
  "ease-press border-hairline text-ink-muted hover:border-edge hover:text-ink inline-flex h-14 shrink-0 items-center justify-center gap-1.5 rounded-2xl border-2 bg-white px-4 text-sm font-bold shadow-[0_4px_0_0_var(--color-lip)] transition-[translate,box-shadow,border-color,color] duration-100 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 focus-visible:outline-none";

interface PlayerSecondaryButtonProps {
  label: string;
  isEnabled: boolean;
  onClick: () => void;
  className?: string;
}

export function PlayerSecondaryButton({
  label,
  isEnabled,
  onClick,
  className,
}: PlayerSecondaryButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isEnabled}
      className={cn(SECONDARY_BUTTON_CLASS, className)}
    >
      <ChevronLeft className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
      <span>{label}</span>
    </button>
  );
}

interface PlayerBrandingLinkProps {
  className?: string;
}

export function PlayerBrandingLink({ className }: PlayerBrandingLinkProps) {
  return (
    <a
      href={env.NEXT_PUBLIC_WEB_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      powered by scibly
    </a>
  );
}
