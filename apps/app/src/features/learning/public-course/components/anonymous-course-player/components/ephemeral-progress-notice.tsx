"use client";

import { Info } from "lucide-react";

import { useTranslation } from "@/i18n/hooks/use-translation";

// Stated on the overview only: worth knowing before starting a course, not
// worth repeating over every scene.
export function EphemeralProgressNotice() {
  const { translations } = useTranslation("publicCourse");

  return (
    <p className="text-muted-foreground mx-auto flex w-full max-w-2xl items-start gap-2 px-1 text-xs">
      <Info className="mt-0.5 size-3.5 shrink-0" />
      {translations.progress.ephemeral}
    </p>
  );
}
