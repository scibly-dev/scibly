"use client";

import { toast } from "sonner";
import { z } from "zod";

import { type NotebookSourcesTranslations } from "./i18n/sources.types";

type EntitlementCopy = NotebookSourcesTranslations["entitlement"];

type SourceMutationError = {
  message: string;
  data?: {
    applicationCode?: string | null;
    details?: unknown;
  } | null;
};

const fill = (template: string, values: Record<string, number | string>) =>
  Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );

const sourceCapDetails = z.object({ shortfall: z.number() });

const creditsDetails = z.object({
  sources: z.number(),
  credits: z.number(),
  balance: z.number(),
});

function refusalCopy(
  copy: EntitlementCopy,
  applicationCode: string,
  details: unknown,
): string | null {
  switch (applicationCode) {
    case "entitlement.source_cap_exhausted": {
      const parsed = sourceCapDetails.safeParse(details);
      if (!parsed.success) return null;
      const { shortfall } = parsed.data;
      return shortfall === 1
        ? copy.sourceCapOne
        : fill(copy.sourceCapMany, { shortfall });
    }
    case "entitlement.credits_exhausted": {
      const parsed = creditsDetails.safeParse(details);
      if (!parsed.success) return copy.creditsNone;
      const { sources, credits, balance } = parsed.data;
      return sources === 1
        ? fill(copy.creditsOne, { balance })
        : fill(copy.creditsMany, { sources, credits, balance });
    }
    case "entitlement.generations_require_subscription":
      return copy.generationsLapsed;
    default:
      return null;
  }
}

export function reportSourceError(
  context: string,
  error: SourceMutationError,
  copy: EntitlementCopy,
): void {
  const applicationCode = error.data?.applicationCode;
  if (applicationCode) {
    const message = refusalCopy(copy, applicationCode, error.data?.details);
    if (message) {
      toast.error(message);
      return;
    }
  }
  console.error(context, error);
}
