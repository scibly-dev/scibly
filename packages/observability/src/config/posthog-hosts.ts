import { pathnameMatchesRoute } from "@scibly/next-proxy/pathname";

export const DEFAULT_API_HOST = "https://eu.i.posthog.com";

const ALLOWED_POSTHOG_API_HOSTS = new Set([
  "https://eu.i.posthog.com",
  "https://us.i.posthog.com",
]);

const ALLOWED_POSTHOG_ASSETS_HOSTS = new Set([
  "https://eu-assets.i.posthog.com",
  "https://us-assets.i.posthog.com",
]);

export function resolveUiHost(apiHost: string): string {
  if (apiHost.includes("eu.i.posthog.com")) {
    return "https://eu.posthog.com";
  }

  if (apiHost.includes("us.i.posthog.com")) {
    return "https://us.posthog.com";
  }

  return apiHost.replace(".i.posthog.com", ".posthog.com");
}

function resolveAssetsHost(apiHost: string): string {
  return apiHost.replace(".i.posthog.com", "-assets.i.posthog.com");
}

function isAllowedPostHogHost(host: string): boolean {
  return (
    ALLOWED_POSTHOG_API_HOSTS.has(host) ||
    ALLOWED_POSTHOG_ASSETS_HOSTS.has(host)
  );
}

export function resolveProxyOrigin(
  apiHost: string,
  pathname: string,
): string | null {
  const origin =
    pathnameMatchesRoute(pathname, "/static") ||
    pathnameMatchesRoute(pathname, "/array")
      ? resolveAssetsHost(apiHost)
      : apiHost;

  return isAllowedPostHogHost(origin) ? origin : null;
}
