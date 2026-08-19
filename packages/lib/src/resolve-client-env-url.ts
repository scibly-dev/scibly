// Rewrites localhost URLs to the browser hostname in dev, so LAN mobile testing works without editing .env.
export function resolveClientEnvUrl(configuredUrl: string): string {
  if (typeof window === "undefined") return configuredUrl;

  try {
    const url = new URL(configuredUrl);
    const isLocalDevHost =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (!isLocalDevHost) return configuredUrl;

    url.hostname = window.location.hostname;
    return url.toString();
  } catch {
    return configuredUrl;
  }
}
