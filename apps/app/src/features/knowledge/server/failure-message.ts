/**
 * Inngest serializes errors to a prototype-less object, which `String()` renders
 * "[object Object]". Host only, never the full URL: a query string can carry a token.
 */
type ProviderError = {
  message?: unknown;
  statusCode?: unknown;
  status?: unknown;
  url?: unknown;
};

export const failureMessage = (error: unknown, max = 500): string => {
  if (typeof error !== "object" || error === null)
    return String(error).slice(0, max);

  // SAFETY: every field is optional and read defensively below.
  const { message, statusCode, status, url } = error as ProviderError;
  const code = statusCode ?? status;
  const host = typeof url === "string" ? URL.parse(url)?.host : null;
  const where = [code, host && `from ${host}`].filter(Boolean).join(" ");

  return (
    ("message" in error ? String(message) : String(error)) +
    (where && ` (${where})`)
  ).slice(0, max);
};
