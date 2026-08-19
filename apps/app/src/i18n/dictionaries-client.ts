import type { Locale } from "@scibly/i18n/constants";
import type { DictionaryPages } from "./types";

import { getLocale } from "@scibly/i18n";
import { createClientDictionaryLoader } from "@scibly/i18n/react";

export const getClientDictionary = createClientDictionaryLoader<
  Locale,
  DictionaryPages
>({
  resolveLocale: (locale) => getLocale(locale, true),
  loaders: {
    en: () => import("./generated/dictionary.en.json").then((m) => m.default),
    de: () => import("./generated/dictionary.de.json").then((m) => m.default),
  },
});
