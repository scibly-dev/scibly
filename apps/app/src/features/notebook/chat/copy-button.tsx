"use client";

import { useCopyFeedback } from "@scibly/ui/hooks/use-copy-feedback";
import { Check, Copy } from "lucide-react";

interface CopyButtonProps {
  textToCopy: string;
}

export function CopyButton({ textToCopy }: CopyButtonProps) {
  const { copied, copy } = useCopyFeedback();

  return (
    <button
      type="button"
      onClick={() => copy(textToCopy)}
      aria-label={copied ? "Copied" : "Copy message"}
      className="inline-flex h-7 min-w-[5.5rem] items-center justify-center gap-1.5 rounded-md px-2 text-[12px] text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 focus-visible:outline-none dark:hover:bg-neutral-800 dark:hover:text-neutral-300 dark:focus-visible:ring-neutral-700"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copy
        </>
      )}
    </button>
  );
}
