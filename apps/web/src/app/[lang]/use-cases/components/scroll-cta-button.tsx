"use client";

import { actionClass, primaryActionClass } from "@scibly/ui/design-language";
import { cn } from "@scibly/ui/utils";

interface ScrollCtaButtonProps {
  label: string;
}

export function ScrollCtaButton({ label }: ScrollCtaButtonProps) {
  return (
    <button
      onClick={() =>
        document
          .getElementById("cta-section")
          ?.scrollIntoView({ behavior: "smooth" })
      }
      className={cn(
        actionClass,
        primaryActionClass,
        "h-12 cursor-pointer px-7 text-[15px]",
      )}
    >
      {label}
    </button>
  );
}
