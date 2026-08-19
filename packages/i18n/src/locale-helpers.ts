import { defaultLocale, type Locale, locales } from "./constants";

export const isLocale = (value: string | null | undefined): value is Locale =>
  locales.some((supported) => supported === value);

export function getLocale(
  locale: string | null | undefined,
  useFallback: true,
): Locale;
export function getLocale(
  locale: string | null | undefined,
  useFallback: false,
): Locale | null;
export function getLocale(
  locale: string | null | undefined,
  useFallback: boolean = true,
): Locale | null {
  if (isLocale(locale)) return locale;
  // TODO: maybe log this such that we can see which language

  return useFallback ? defaultLocale : null;
}

export const createIsValidPage = <const P extends readonly string[]>(
  pages: P,
) => {
  const set = new Set<string>(pages);
  return (page: P[number]): boolean => set.has(page);
};

export const appendLocalePrefix = (
  locale: Locale,
  pathFromRoot: string,
): string => {
  const normalized = pathFromRoot.startsWith("/")
    ? pathFromRoot
    : `/${pathFromRoot}`;
  return `/${locale}${normalized}`;
};

export const pathnameHasLocalePrefix = (pathname: string): boolean =>
  locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

export const localeFromPathname = (pathname: string): Locale | null => {
  const normalizedPathname = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;
  const [firstSegment] = normalizedPathname.split("/").filter(Boolean);
  return isLocale(firstSegment) ? firstSegment : null;
};

export const stripLocaleFromPathname = (pathname: string) => {
  const normalizedPathname = pathname.startsWith("/")
    ? pathname
    : `/${pathname}`;
  const segments = normalizedPathname.split("/").filter(Boolean);
  if (segments.length === 0) return "/";

  const [firstSegment, ...remainingSegments] = segments;
  if (!isLocale(firstSegment)) return normalizedPathname;

  if (remainingSegments.length === 0) return "/";
  return `/${remainingSegments.join("/")}`;
};
