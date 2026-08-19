import type { DictionaryPages, Pages } from "@/i18n/types";

import { getLocale } from "@scibly/i18n";
import { createUseTranslation } from "@scibly/i18n/react";
import { useParams } from "next/navigation";

import { getClientDictionary } from "@/i18n/dictionaries-client";

import { pages } from "../constants";

const useTranslationInner = createUseTranslation<DictionaryPages, Pages>({
  pages,
  useRouteParams: useParams,
  getLocale: (lang: string | undefined, useFallback: true) =>
    getLocale(lang, useFallback),
  getDictionary: (locale: string) => getClientDictionary(locale),
});

export function useTranslation<T extends Pages>(page: T) {
  return useTranslationInner(page);
}
