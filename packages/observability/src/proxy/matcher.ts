export const INGEST_PROXY_MATCHER = "/ingest/:path*" as const;

export const PROXY_MATCHER = [
  INGEST_PROXY_MATCHER,
  "/((?!api/|_next/|_proxy/|_static/|ingest|jwks|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|.well-known).*)",
] as const;
