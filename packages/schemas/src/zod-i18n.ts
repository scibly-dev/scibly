/// <reference path="./zod-locale-modules.d.ts" />
import type { Locale } from "@scibly/i18n/constants";

import { type ZodError, type ZodIssue } from "zod";
import de from "zod/v4/locales/de";
import en from "zod/v4/locales/en";

export type RhfLikeFieldError = {
  message?: string;
} | undefined;

// SAFETY: zod types `localeError` for its own generic error map; every issue we
// pass it comes from a ZodError raised by that same locale's schemas.
const getLocaleError = (locale: Locale) =>
  (locale === "en" ? en() : de()).localeError as (issue: ZodIssue) => string;

const formatZodIssue = (issue: ZodIssue, locale: Locale): string => {
  if (issue.code === "custom") {
    return issue.message;
  }
  return getLocaleError(locale)(issue);
};

type FlattenedZodError = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

export const formatZodErrorForTrpc = (
  error: ZodError,
  locale: Locale,
): FlattenedZodError =>
  error.flatten((issue) => formatZodIssue(issue, locale));

export const summarizeZodError = (error: ZodError, locale: Locale): string => {
  const { formErrors, fieldErrors } = formatZodErrorForTrpc(error, locale);
  const parts = [
    ...formErrors,
    ...Object.values(fieldErrors).flatMap((v) => v ?? []),
  ].filter(Boolean);
  return parts.join("; ");
};

export const formatFieldErrorMessage = (
  error: RhfLikeFieldError,
  options: {
    locale: Locale;
    translate?: (raw: string) => string | undefined;
    fallbackDe?: string;
  },
): string | undefined => {
  const raw = error?.message;
  if (!raw) return undefined;

  const translated = options.translate?.(raw);
  if (translated) return translated;

  if (options.locale === "en") {
    return raw;
  }

  return options.fallbackDe ?? raw;
};
