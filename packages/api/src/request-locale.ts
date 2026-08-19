import { AsyncLocalStorage } from "node:async_hooks";

import { defaultLocale, type Locale } from "@scibly/i18n/constants";

import "server-only";

const requestLocaleStorage = new AsyncLocalStorage<Locale>();

export const runWithRequestLocale = async <T>(
  locale: Locale,
  fn: () => Promise<T>,
): Promise<T> => requestLocaleStorage.run(locale, fn);

export const getRequestLocale = (): Locale =>
  requestLocaleStorage.getStore() ?? defaultLocale;
