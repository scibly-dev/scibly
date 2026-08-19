"use client";

import { cn } from "@scibly/ui/utils";
import { memo } from "react";

type ClozeComposerPlaceholderProps = {
  lead: string;
  bodyClassName?: string;
};

export const ClozeComposerPlaceholder = memo(
  (props: ClozeComposerPlaceholderProps) => {
    const { lead, bodyClassName } = props;

    return (
      <span
        aria-hidden
        className={cn(
          "pointer-events-none text-neutral-400/80 dark:text-neutral-500/80",
          bodyClassName,
        )}
      >
        {lead}
      </span>
    );
  },
);
ClozeComposerPlaceholder.displayName = "ClozeComposerPlaceholder";
