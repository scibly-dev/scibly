"use client";

import Icon from "@scibly/ui/components/icon";
import { chipClass } from "@scibly/ui/design-language";
import { useCopyFeedback } from "@scibly/ui/hooks/use-copy-feedback";
import { cn } from "@scibly/ui/utils";
import React, { useSyncExternalStore } from "react";

// Shared chrome for the icon-only network buttons; each one sets its own face/lip color below.
const shareKeyClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-xl border-2 text-white no-underline shadow-[0_3px_0_0_var(--key-lip)] transition-[translate,box-shadow,filter] duration-100 ease-press hover:brightness-110 active:translate-y-[3px] active:shadow-none focus-visible:ring-4 focus-visible:ring-[#0066FF]/25 focus-visible:outline-none";

const shareKeyTones = {
  x: { face: "#131c46", lip: "#050b28" },
  linkedin: { face: "#0a66c2", lip: "#074a8f" },
} as const;

interface ShareButtonsProps {
  shareText: string;
  copiedText: string;
}

function getEncodedShareUrl() {
  return encodeURIComponent(window.location.href);
}

function subscribeToShareUrl() {
  return () => {};
}

export function ShareButtons({ shareText, copiedText }: ShareButtonsProps) {
  const { copied, copy } = useCopyFeedback();
  const shareUrl = useSyncExternalStore(
    subscribeToShareUrl,
    getEncodedShareUrl,
    () => "",
  );

  return (
    <div className="flex items-center gap-3">
      {/* Copy Link Button */}
      <button
        onClick={() => copy(window.location.href)}
        className={cn(
          chipClass,
          copied
            ? "border-[#72dfc8] bg-[#e6faf5] text-[#055e4e] shadow-[0_3px_0_0_#b6ecdf]"
            : "text-link border-[#c9dcff] bg-[#eef4ff] shadow-[0_3px_0_0_#d9e6ff] hover:bg-[#e3edff]",
          "inline-flex items-center gap-1.5",
        )}
        aria-label="Copy link"
      >
        {copied ? (
          <>
            <Icon
              name="Check"
              className="animate-in fade-in zoom-in-75 h-3.5 w-3.5 duration-200"
            />
            <span>{copiedText}</span>
          </>
        ) : (
          <>
            <Icon name="Link" className="h-3.5 w-3.5" />
            <span>{shareText}</span>
          </>
        )}
      </button>

      {/* X Share */}
      <a
        href={`https://x.com/intent/tweet?url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={shareKeyClass}
        style={{
          backgroundColor: shareKeyTones.x.face,
          borderColor: shareKeyTones.x.face,
          "--key-lip": shareKeyTones.x.lip,
        }}
        aria-label="Share on X"
      >
        {/* lucide still ships the bird, so the X mark is drawn here */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-3.5 w-3.5"
          aria-hidden
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
        </svg>
      </a>

      {/* LinkedIn Share */}
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={shareKeyClass}
        style={{
          backgroundColor: shareKeyTones.linkedin.face,
          borderColor: shareKeyTones.linkedin.face,
          "--key-lip": shareKeyTones.linkedin.lip,
        }}
        aria-label="Share on LinkedIn"
      >
        <Icon name="Linkedin" className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
