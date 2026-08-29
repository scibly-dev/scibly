import { getSessionCookie } from "@scibly/auth/cookies";
import {
  appendLocalePrefix,
  pathnameHasLocalePrefix,
  stripLocaleFromPathname,
} from "@scibly/i18n";
import {
  localeCookieName,
  localeCookieOptions,
} from "@scibly/i18n/constants";
import { loadPackageEnv } from "@scibly/lib/internal";
import {
  appRoutesPathnames,
  EMBED_ROUTE_PATHNAME,
  protectedRoutePathnames,
  REDIRECT_URL_PARAM,
  routes,
  webRoutesPathnames,
} from "@scibly/routes";
import { type NextRequest, NextResponse } from "next/server";

import {
  createRedirectWithLocale,
  createRewriteWithLocale,
  resolveLocaleFromRequest,
} from "./locale";
import { pathnameMatchesRoute } from "./pathname";
import { checkStaticFiles } from "./static-assets";

export const SCIBLY_PATHNAME_HEADER = "x-scibly-pathname";

// Embedded courses may be framed by anyone the author pastes the snippet into; every other route disallows framing.
export function frameAncestorsFor(pathnameWithoutLocale: string): string {
  return pathnameMatchesRoute(pathnameWithoutLocale, EMBED_ROUTE_PATHNAME)
    ? "*"
    : "'none'";
}

function continueWithPathname(
  request: NextRequest,
  pathname: string,
  headers = new Headers(request.headers),
) {
  headers.set(SCIBLY_PATHNAME_HEADER, pathname);
  return NextResponse.next({ request: { headers } });
}

export const env = loadPackageEnv("@scibly/next-proxy", {
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

type BaseProxyOptions = {
  skipPathPrefixes?: readonly string[];
};

export const DEFAULT_SKIP_PATH_PREFIXES = [
  "/assets",

  "/embed/v1.js",
  "/llms.txt",
  "/llms-full.txt",
  "/sitemap.xml",
  "/robots.txt",
  "/.well-known",
] as const;

export const baseProxy = (options?: BaseProxyOptions) => {
  const resolvedOptions = {
    skipPathPrefixes: [
      ...DEFAULT_SKIP_PATH_PREFIXES,
      ...(options?.skipPathPrefixes ?? []),
    ],
  };

  const profilePathname = new URL(routes.app.profile.root).pathname;
  const profileDefaultPathname = new URL(routes.app.profile.default).pathname;
  const orgSlugPattern = new RegExp(`^${profilePathname}/org/[^/]+$`);

  const route = async (request: NextRequest): Promise<NextResponse> => {
    const pathname = request.nextUrl.pathname;
    const pathnameWithoutLocale = stripLocaleFromPathname(pathname);

    if (
      resolvedOptions.skipPathPrefixes.some((prefix) =>
        pathnameMatchesRoute(pathnameWithoutLocale, prefix),
      )
    ) {
      return continueWithPathname(request, pathnameWithoutLocale);
    }

    const isAppUrl = appRoutesPathnames.some((appRoute) =>
      pathnameMatchesRoute(pathnameWithoutLocale, appRoute),
    );

    if (isAppUrl && env.NEXT_PUBLIC_BASE_URL !== env.NEXT_PUBLIC_APP_URL) {
      return createRedirectWithLocale(
        request,
        new URL(env.NEXT_PUBLIC_APP_URL).origin,
        pathname,
      );
    }

    const isWebUrl = webRoutesPathnames.some((webRoute) =>
      pathnameMatchesRoute(pathnameWithoutLocale, webRoute),
    );

    if (isWebUrl && env.NEXT_PUBLIC_BASE_URL !== env.NEXT_PUBLIC_WEB_URL) {
      return createRedirectWithLocale(
        request,
        new URL(env.NEXT_PUBLIC_WEB_URL).origin,
        pathname,
      );
    }

    const isAuthRoute = pathnameMatchesRoute(
      pathnameWithoutLocale,
      new URL(routes.app.auth.root).pathname,
    );
    const session = getSessionCookie(request);

    if (isAuthRoute && session) {
      const newUrl = new URL(routes.app.auth.callback.login.success);
      return createRedirectWithLocale(request, newUrl.origin, newUrl.pathname);
    }

    if (isAuthRoute && !session) {
      const referer = request.headers.get("referer");
      if (referer) {
        try {
          const refererUrl = new URL(referer);
          let needsRedirect = false;
          const newSearchParams = new URLSearchParams(
            request.nextUrl.searchParams,
          );

          refererUrl.searchParams.forEach((value, key) => {
            if (!newSearchParams.has(key)) {
              newSearchParams.set(key, value);
              needsRedirect = true;
            }
          });

          if (needsRedirect) {
            return createRedirectWithLocale(
              request,
              request.url,
              pathname,
              newSearchParams,
            );
          }
        } catch {}
      }
    }

    const isProtectedRoute = protectedRoutePathnames.some((fragment) =>
      pathnameMatchesRoute(pathnameWithoutLocale, fragment),
    );

    if (isProtectedRoute && !session) {
      const newUrl = new URL(routes.app.auth.signIn);
      newUrl.searchParams.set(REDIRECT_URL_PARAM, request.nextUrl.pathname);
      return createRedirectWithLocale(
        request,
        newUrl.origin,
        newUrl.pathname,
        newUrl.searchParams,
      );
    }

    if (
      pathnameWithoutLocale !== profileDefaultPathname &&
      (pathnameWithoutLocale === profilePathname ||
        pathnameWithoutLocale === `${profilePathname}/org`)
    ) {
      return createRedirectWithLocale(
        request,
        request.url,
        profileDefaultPathname,
      );
    }

    if (orgSlugPattern.test(pathnameWithoutLocale)) {
      return createRedirectWithLocale(
        request,
        request.url,
        `${pathnameWithoutLocale}/learn`,
      );
    }

    let constructedPathname = pathname;
    const pathnameHasLocale = pathnameHasLocalePrefix(constructedPathname);
    const isBaseAuthRoot =
      pathnameWithoutLocale === new URL(routes.app.auth.root).pathname;

    if (!isBaseAuthRoot && pathnameHasLocale) {
      const locale = resolveLocaleFromRequest(request);
      const headers = new Headers(request.headers);
      headers.set("x-scibly-locale", locale);
      const response = continueWithPathname(
        request,
        pathnameWithoutLocale,
        headers,
      );
      // A locale in the URL is an explicit choice: persist it, or the next
      // locale-less in-app link (rewritten from the cookie) drops back to a
      // stale locale. A prefetch is not a choice, so it may not flip the cookie.
      if (!request.headers.get("next-router-prefetch")) {
        response.cookies.set(localeCookieName, locale, localeCookieOptions);
      }
      return response;
    }

    if (pathnameMatchesRoute(pathnameWithoutLocale, EMBED_ROUTE_PATHNAME)) {
      const locale = resolveLocaleFromRequest(request);
      const headers = new Headers(request.headers);
      headers.set("x-scibly-locale", locale);
      headers.set(SCIBLY_PATHNAME_HEADER, pathnameWithoutLocale);
      const rewriteUrl = new URL(request.url);
      rewriteUrl.pathname = appendLocalePrefix(locale, pathnameWithoutLocale);
      return NextResponse.rewrite(rewriteUrl, { request: { headers } });
    }

    if (isProtectedRoute) {
      const locale = resolveLocaleFromRequest(request);
      const headers = new Headers(request.headers);
      headers.set("x-scibly-locale", locale);
      headers.set(SCIBLY_PATHNAME_HEADER, pathnameWithoutLocale);
      return createRewriteWithLocale(request, pathname, headers);
    }

    if (isBaseAuthRoot) {
      constructedPathname = new URL(routes.app.auth.signIn).pathname;
    }

    return createRedirectWithLocale(request, request.url, constructedPathname);
  };

  return async (request: NextRequest): Promise<NextResponse> => {
    const staticResult = checkStaticFiles(request.nextUrl.pathname);
    if (staticResult) return staticResult;

    const response = await route(request);
    response.headers.set(
      "Content-Security-Policy",
      `frame-ancestors ${frameAncestorsFor(
        stripLocaleFromPathname(request.nextUrl.pathname),
      )}`,
    );
    return response;
  };
};
