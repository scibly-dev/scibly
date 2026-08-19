"use client";

import { useEffect, useRef, useState } from "react";

const COPIED_FEEDBACK_MS = 2000;

// `copied` follows the write, not the click — a clipboard write the browser refuses must not claim success.
export function useCopyFeedback() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  return {
    copied,
    copy: (text: string) => {
      void navigator.clipboard.writeText(text).then(
        () => {
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(
            () => setCopied(false),
            COPIED_FEEDBACK_MS,
          );
        },
        (error: unknown) => console.error("Failed to copy to clipboard", error),
      );
    },
  };
}
