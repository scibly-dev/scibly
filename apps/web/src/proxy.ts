import { createAppProxy } from "@scibly/observability/proxy";

// Keep matcher literals in this file — Next.js must parse them at compile time.
// Values must match PROXY_MATCHER in @scibly/observability/proxy/matcher (see proxy.test.ts).
export const config = {
  matcher: [
    "/ingest/:path*",
    "/((?!api/|_next/|_proxy/|_static/|ingest|jwks|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|.well-known).*)",
  ],
};

export const proxy = createAppProxy();
