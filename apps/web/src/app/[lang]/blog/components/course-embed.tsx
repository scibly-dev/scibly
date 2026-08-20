"use client";

import Script from "next/script";

const EMBED_SCRIPT_SRC = "https://app.scibly.com/embed/v1.js";

interface CourseEmbedProps {
  src: string;
  title: string;
  widthPx?: number;
  heightPx?: number;
}

// Mirrors the snippet from apps/app/.../embed-course/snippet.ts as a JSX-safe
// component: `style` must be an object here, and next/script (not a raw
// <script> tag) is how this codebase loads third-party embed loaders.
export function CourseEmbed({
  src,
  title,
  widthPx = 640,
  heightPx = 600,
}: CourseEmbedProps) {
  return (
    <div className="border-hairline bg-ground-soft my-9 overflow-hidden rounded-[20px] border-2 p-2 shadow-[0_4px_0_0_var(--color-lip)]">
      <iframe
        src={src}
        title={title}
        data-scibly-embed
        width={widthPx}
        height={heightPx}
        style={{ width: "100%", height: `${heightPx}px`, border: 0 }}
        allow="autoplay"
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
        className="rounded-[14px]"
      />
      <Script src={EMBED_SCRIPT_SRC} strategy="afterInteractive" />
    </div>
  );
}
