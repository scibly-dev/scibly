import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";

import {
  defaultLocale,
  type Locale,
  localeCookieName,
  locales,
} from "./constants";
import { getLocale, localeFromPathname } from "./locale-helpers";

const LOCALE_HEADER = "x-scibly-locale";
const NEXT_URL_HEADER = "next-url";

const tryLocaleFromUrlString = (urlLike: string | null): Locale | null => {
  if (!urlLike) return null;
  try {
    const pathname = urlLike.startsWith("http")
      ? new URL(urlLike).pathname
      : urlLike.startsWith("/")
        ? urlLike
        : `/${urlLike}`;
    return localeFromPathname(pathname);
  } catch {
    return null;
  }
};

// Negotiator hands back whatever the client sent — wildcards, malformed tags like "en_US" — and
// match() throws a RangeError on those, so this filters first.
const isWellFormedLanguageTag = (tag: string): boolean => {
  try {
    Intl.getCanonicalLocales(tag);
    return true;
  } catch {
    return false;
  }
};

export const matchAcceptLanguage = (acceptLanguage: string | null): Locale => {
  if (!acceptLanguage) return defaultLocale;
  const languages = new Negotiator({
    headers: { "accept-language": acceptLanguage },
  })
    .languages()
    .filter(isWellFormedLanguageTag);
  if (languages.length === 0) return defaultLocale;
  return getLocale(match(languages, locales, defaultLocale), true);
};

// Priority: explicit header → Next URL hint → Referer path → cookie → Accept-Language → German.
export const resolveLocaleFromHeaders = (headers: Headers): Locale => {
  const headerLocale = getLocale(headers.get(LOCALE_HEADER)?.trim(), false);
  if (headerLocale) return headerLocale;

  const nextUrlLocale = tryLocaleFromUrlString(headers.get(NEXT_URL_HEADER));
  if (nextUrlLocale) return nextUrlLocale;

  const refererLocale = tryLocaleFromUrlString(headers.get("referer"));
  if (refererLocale) return refererLocale;

  const cookieValue = headers.get("cookie")?.split(";").map((c) => c.trim());
  if (cookieValue) {
    for (const part of cookieValue) {
      if (part.startsWith(`${localeCookieName}=`)) {
        const raw = part.slice(localeCookieName.length + 1);
        const fromCookie = getLocale(decodeURIComponent(raw), false);
        if (fromCookie) return fromCookie;
      }
    }
  }

  return matchAcceptLanguage(headers.get("Accept-Language"));
};
