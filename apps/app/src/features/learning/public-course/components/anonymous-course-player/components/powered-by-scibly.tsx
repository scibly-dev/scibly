"use client";

import { env } from "@/env";
import { useTranslation } from "@/i18n/hooks/use-translation";

// Opens in a new tab so it never navigates the host's frame away.
export function PoweredByScibly() {
  const { translations } = useTranslation("learningPlayer");

  return (
    <p className="mt-4 text-center">
      <a
        href={env.NEXT_PUBLIC_WEB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground text-xs transition-colors"
      >
        {translations.branding.poweredBy}
      </a>
    </p>
  );
}
