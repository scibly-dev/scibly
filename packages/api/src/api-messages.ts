import { type Locale } from "@scibly/i18n/constants";

import dictionaryDe from "./i18n/generated/dictionary.de.json";
import dictionaryEn from "./i18n/generated/dictionary.en.json";

const interpolate = (
  template: string,
  params?: Record<string, string | number>,
): string => {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key)
      ? String(params[key])
      : "",
  );
};

const packageMessagesDe: Record<string, string> = dictionaryDe;
const packageMessagesEn: Record<string, string> = dictionaryEn;

type PackageApiMessageKey = keyof typeof dictionaryDe;

/**
 * Messages for routers that live in `@scibly/api` (merged from per-router `i18n` folders under `src/router`).
 */
const getPackageApiErrorMessage = (
  key: PackageApiMessageKey,
  locale: Locale,
  params?: Record<string, string | number>,
): string => {
  const dict = locale === "en" ? packageMessagesEn : packageMessagesDe;
  const raw = dict[key];
  if (raw === undefined) {
    throw new Error(
      `Missing package API i18n entry for key "${String(key)}" (locale: ${locale})`,
    );
  }
  return interpolate(raw, params);
};

export const getInternalUnexpectedErrorMessage = (locale: Locale): string =>
  getPackageApiErrorMessage("internalUnexpected", locale);
