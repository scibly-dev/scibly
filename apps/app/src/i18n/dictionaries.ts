import type { Locale } from "@scibly/i18n/constants";
import type { Dictionary, DictionaryPages, Pages } from "./types";

import { getLocale } from "@scibly/i18n";
import { assertExhaustive } from "@scibly/lib";

import "server-only";

const loadMerged = async (locale: Locale): Promise<DictionaryPages> => {
  switch (locale) {
    case "en":
      return import("./generated/dictionary.en.json").then((m) => m.default);
    case "de":
      return import("./generated/dictionary.de.json").then((m) => m.default);

    default:
      return assertExhaustive(locale);
  }
};

const fullDictionaryCache = new Map<Locale, DictionaryPages>();

export const getFullDictionary = async (
  locale: string,
): Promise<DictionaryPages> => {
  const resolvedLocale = getLocale(locale, true);
  const cached = fullDictionaryCache.get(resolvedLocale);
  if (cached) {
    return cached;
  }
  const data = await loadMerged(resolvedLocale);
  fullDictionaryCache.set(resolvedLocale, data);
  return data;
};

export const getDictionary = async <T extends Pages>(
  locale: string,
  page: T,
): Promise<Dictionary["page"][T]> => {
  const full = await getFullDictionary(locale);
  return full[page];
};
