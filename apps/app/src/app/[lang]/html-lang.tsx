"use client";

import type { Locale } from "@scibly/i18n/constants";

import { useLayoutEffect } from "react";

// The script sets `lang` before first paint; the effect covers what it can't reach — locale switches and the dev Strict Mode remount.
export function HtmlLang({ lang }: { lang: Locale }) {
  useLayoutEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      // `Locale`, not `string`: `JSON.stringify` does not escape `</script>`.
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang=${JSON.stringify(lang)}`,
      }}
    />
  );
}
