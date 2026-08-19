import {
  appendLocalePrefix,
  localeFromPathname,
  pathnameHasLocalePrefix,
} from "@scibly/i18n";
import {
  type Locale,
  localeCookieName,
  localeCookieOptions,
  locales,
} from "@scibly/i18n/constants";
import { matchAcceptLanguage } from "@scibly/i18n/resolve-locale-from-headers";
import { type NextRequest, NextResponse } from "next/server";

import { copySearchParams } from "./search-params";

export const resolveLocaleFromRequest = (request: NextRequest): Locale => {
  const pathLocale = localeFromPathname(request.nextUrl.pathname);
  if (pathLocale) {
    return pathLocale;
  }

  const cookieValue = request.cookies.get(localeCookieName)?.value;
  const cookieLocale = locales.find((locale) => locale === cookieValue);
  if (cookieLocale) {
    return cookieLocale;
  }

  return matchAcceptLanguage(request.headers.get("Accept-Language"));
};

// `routes.app.*` hrefs carry no locale prefix; redirecting there would cost every in-app click a round trip and break prefetching (a prefetch of `/profile/x` would answer 307, not an RSC payload).
export const createRewriteWithLocale = (
  request: NextRequest,
  pathname: string,
  headers: Headers,
) => {
  const locale = resolveLocaleFromRequest(request);
  const rewriteUrl = new URL(request.url);
  rewriteUrl.pathname = appendLocalePrefix(locale, pathname);
  const constructedResponse = NextResponse.rewrite(rewriteUrl, {
    request: { headers },
  });
  constructedResponse.cookies.set(
    localeCookieName,
    locale,
    localeCookieOptions,
  );
  return constructedResponse;
};

export const createRedirectWithLocale = (
  request: NextRequest,
  hostUrl: string,
  pathname: string,
  searchParams?: URLSearchParams,
) => {
  const locale = resolveLocaleFromRequest(request);
  const pathnameHasLocale = pathnameHasLocalePrefix(pathname);
  let resolvedPathname = pathname;
  if (!pathnameHasLocale) {
    resolvedPathname = appendLocalePrefix(locale, pathname);
  }
  const redirectUrl = new URL(resolvedPathname, hostUrl);
  copySearchParams(request, redirectUrl, searchParams);
  const constructedResponse = NextResponse.redirect(redirectUrl);
  constructedResponse.cookies.set(
    localeCookieName,
    locale,
    localeCookieOptions,
  );
  return constructedResponse;
};
