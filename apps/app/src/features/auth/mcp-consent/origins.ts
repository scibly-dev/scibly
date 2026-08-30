/**
 * Registration is open to anyone (RFC 7591), so a client's name is whatever it
 * called itself, while its redirect origin is where the code actually lands.
 */
export function consentDestinations(redirectUrls: string): string[] {
  const origins = redirectUrls.split(",").map((url) => {
    const trimmed = url.trim();
    try {
      return new URL(trimmed).origin;
    } catch {
      return trimmed;
    }
  });
  return [...new Set(origins.filter(Boolean))];
}
