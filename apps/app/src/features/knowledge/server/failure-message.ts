/**
 * Inngest hands `onFailure` and the last attempt a serialized error — a plain
 * object with no prototype, which `String()` renders "[object Object]". Every
 * failure this feature stores goes through here, and every one of them is shown
 * to someone who can act on it, so it is capped rather than kept whole.
 *
 * The status and host come along because they are the whole message: an AI SDK
 * or Octokit error says "Not Found", which names neither what was not found nor
 * where. Host only, never the full URL — a query string can carry a token.
 */
/** What AI SDK, Octokit and Inngest errors actually carry, none of it promised. */
type ProviderError = {
  message?: unknown;
  statusCode?: unknown;
  status?: unknown;
  url?: unknown;
};

export const failureMessage = (error: unknown, max = 500): string => {
  if (typeof error !== "object" || error === null)
    return String(error).slice(0, max);

  // SAFETY: every field is optional and read defensively below — a provider
  // whose error carries none of them, or carries them at other types, falls
  // through to the bare message.
  const { message, statusCode, status, url } = error as ProviderError;
  const code = statusCode ?? status;
  const host = typeof url === "string" ? URL.parse(url)?.host : null;
  const where = [code, host && `from ${host}`].filter(Boolean).join(" ");

  return (
    ("message" in error ? String(message) : String(error)) +
    (where && ` (${where})`)
  ).slice(0, max);
};
