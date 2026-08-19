import { stripLocaleFromPathname } from "@scibly/i18n";
import { pathnameMatchesRoute } from "@scibly/next-proxy/pathname";
import { type NextRequest,NextResponse } from "next/server";

import { INGEST_PATH } from "../config/env";
import { resolveProxyOrigin } from "../config/posthog-hosts";

function stripForwardHeaders(headers: Headers): Headers {
  const forwarded = new Headers();

  for (const [key, value] of headers.entries()) {
    const normalized = key.toLowerCase();
    if (normalized === "cookie" || normalized === "authorization") {
      continue;
    }
    forwarded.set(key, value);
  }

  return forwarded;
}

function rewriteToPostHog(
  request: NextRequest,
  origin: string,
  pathname: string,
): NextResponse {
  const url = new URL(pathname, origin);
  url.search = request.nextUrl.search;

  const headers = stripForwardHeaders(request.headers);
  headers.set("host", url.host);

  return NextResponse.rewrite(url, { request: { headers } });
}

export function proxyPostHogRequest(
  request: NextRequest,
  apiHost: string,
): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (pathnameMatchesRoute(pathname, INGEST_PATH)) {
    const relative = pathname.slice(INGEST_PATH.length) || "/";
    const origin = resolveProxyOrigin(apiHost, relative);
    if (!origin) {
      return null;
    }

    return rewriteToPostHog(request, origin, relative);
  }

  const strippedPath = stripLocaleFromPathname(pathname);
  if (pathnameMatchesRoute(strippedPath, "/static")) {
    const origin = resolveProxyOrigin(apiHost, strippedPath);
    if (!origin) {
      return null;
    }

    return rewriteToPostHog(request, origin, strippedPath);
  }

  return null;
}
