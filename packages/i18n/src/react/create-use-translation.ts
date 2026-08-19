"use client";

import { use } from "react";

export type UseRouteParamsForLang = () => Readonly<{
  lang?: string | string[];
}>;

export type CreateUseTranslationOptions<
  DictionaryPages,
  Pages extends string & keyof DictionaryPages,
> = {
  pages: readonly Pages[];

  useRouteParams: UseRouteParamsForLang;
  getLocale: (lang: string | undefined, useFallback: true) => string;
  getDictionary: (locale: string) => Promise<DictionaryPages>;
};

export const createUseTranslation = <
  DictionaryPages,
  const Pages extends string & keyof DictionaryPages,
>(
  options: CreateUseTranslationOptions<DictionaryPages, Pages>,
) => {
  const { pages: allowedPages, useRouteParams, getLocale, getDictionary } = options;

  const allowed = new Set<string>(allowedPages);

  const useTranslation = <T extends Pages>(page: T) => {
    const params = useRouteParams();
    const raw = params.lang;
    const lang = Array.isArray(raw) ? raw[0] : raw;
    const locale = getLocale(lang, true);

    if (!allowed.has(page)) {
      throw new Error("No translations found for this page");
    }

    // The loader hands back one cached promise per locale, so this suspends on
    // the first render and reads through on every later one.
    const pages = use(getDictionary(locale));

    return { translations: pages[page] };
  };

  return useTranslation;
};
