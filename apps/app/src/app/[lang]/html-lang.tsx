"use client";

import { useLayoutEffect } from "react";

// `<html>` is one segment above, where the locale isn't a param yet. The inline
// script corrects `lang` before first paint on full loads; the effect covers
// what the script can't reach — locale switches (client-rendered scripts never
// execute) and the dev Strict Mode remount, which resets `<html>` attributes.
export function HtmlLang({ lang }: { lang: string }) {
  useLayoutEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `document.documentElement.lang=${JSON.stringify(lang)}`,
      }}
    />
  );
}
