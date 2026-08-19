import {
  assertSafeResolvedOutboundUrl,
  UnsafeOutboundUrlError,
} from "@/lib/network/ssrf-guard";
import {
  WEB_FETCH_MAX_REDIRECTS,
  WEB_FETCH_MAX_RETRIES,
  WEB_FETCH_RETRY_DELAY_MS,
} from "@/shared/content/sources/constants";

export const REQUEST_TIMEOUT_MS = 15_000;

export const TOTAL_TIMEOUT_MS = 45_000;

export const MAX_RETRY_AFTER_MS = 5_000;

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

export class ResponseTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(
      `Response exceeded the ${maxBytes.toLocaleString()}-byte download limit.`,
    );
    this.name = "ResponseTooLargeError";
  }
}

export class WebFetchTimeoutError extends Error {
  constructor() {
    super("The page took too long to respond.");
    this.name = "WebFetchTimeoutError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function remainingMs(deadlineAt: number): number {
  return deadlineAt - Date.now();
}

function isRedirectStatus(status: number): boolean {
  return status >= 300 && status < 400;
}

function parseRetryAfterMs(retryAfter: string | null): number | null {
  if (!retryAfter) return null;
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(seconds * 1_000, MAX_RETRY_AFTER_MS);
  }
  const dateMs = Date.parse(retryAfter);
  if (Number.isNaN(dateMs)) return null;
  return Math.min(Math.max(0, dateMs - Date.now()), MAX_RETRY_AFTER_MS);
}

function shouldRetryError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.name === "TimeoutError" ||
    error.name === "AbortError" ||
    /fetch failed|network|timed out|ECONNRESET|ENOTFOUND|EAI_AGAIN/i.test(
      error.message,
    )
  );
}

function isTerminalFetchError(error: unknown, attempt: number): boolean {
  if (error instanceof UnsafeOutboundUrlError) return true;
  if (error instanceof WebFetchTimeoutError) return true;
  const message = error instanceof Error ? error.message : "";
  if (/Too many redirects|missing Location header/i.test(message)) return true;
  return !shouldRetryError(error) || attempt >= WEB_FETCH_MAX_RETRIES;
}

function shouldReturnResponse(response: Response, attempt: number): boolean {
  return (
    response.ok ||
    !RETRYABLE_STATUS_CODES.has(response.status) ||
    attempt >= WEB_FETCH_MAX_RETRIES
  );
}

async function sleepWithinBudget(
  delayMs: number,
  deadlineAt: number,
): Promise<void> {
  const budget = remainingMs(deadlineAt);
  if (budget <= 0) throw new WebFetchTimeoutError();
  await sleep(Math.min(delayMs, budget));
}

async function waitForHttpRetry(
  url: string,
  response: Response,
  attempt: number,
  deadlineAt: number,
): Promise<void> {
  const delayMs =
    parseRetryAfterMs(response.headers.get("retry-after")) ??
    WEB_FETCH_RETRY_DELAY_MS * (attempt + 1);
  console.log("[fetchWebPage]", "Retrying after transient HTTP status", {
    url,
    status: response.status,
    attempt: attempt + 1,
    delayMs,
  });
  await sleepWithinBudget(delayMs, deadlineAt);
}

async function waitForErrorRetry(
  url: string,
  error: unknown,
  attempt: number,
  deadlineAt: number,
): Promise<void> {
  const delayMs = WEB_FETCH_RETRY_DELAY_MS * (attempt + 1);
  console.log("[fetchWebPage]", "Retrying after fetch error", {
    url,
    attempt: attempt + 1,
    delayMs,
    message: error instanceof Error ? error.message : String(error),
  });
  await sleepWithinBudget(delayMs, deadlineAt);
}

async function fetchPageResponse(
  url: string,
  headers: HeadersInit,
  deadlineAt: number,
): Promise<{ response: Response; finalUrl: string }> {
  let currentUrl = url;
  for (
    let redirectCount = 0;
    redirectCount <= WEB_FETCH_MAX_REDIRECTS;
    redirectCount++
  ) {
    await assertSafeResolvedOutboundUrl(currentUrl, "strict");

    const budget = remainingMs(deadlineAt);
    if (budget <= 0) throw new WebFetchTimeoutError();
    const response = await fetch(currentUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(Math.min(REQUEST_TIMEOUT_MS, budget)),
      headers,
    });
    if (!isRedirectStatus(response.status)) {
      return { response, finalUrl: currentUrl };
    }

    const location = response.headers.get("location");
    if (!location) {
      throw new Error(
        `Redirect response (${response.status}) missing Location header.`,
      );
    }
    const previousUrl = currentUrl;
    currentUrl = new URL(location, currentUrl).href;
    console.log("[fetchWebPage]", "Following redirect", {
      from: response.url || previousUrl,
      to: currentUrl,
      status: response.status,
      redirectCount: redirectCount + 1,
    });
  }
  throw new Error(`Too many redirects (limit is ${WEB_FETCH_MAX_REDIRECTS}).`);
}

export async function fetchPageWithRetries(
  url: string,
  headers: HeadersInit,
  deadlineAt: number = Date.now() + TOTAL_TIMEOUT_MS,
): Promise<{ response: Response; finalUrl: string; attempts: number }> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= WEB_FETCH_MAX_RETRIES; attempt++) {
    try {
      const result = await fetchPageResponse(url, headers, deadlineAt);
      if (shouldReturnResponse(result.response, attempt)) {
        return { ...result, attempts: attempt + 1 };
      }
      await waitForHttpRetry(url, result.response, attempt, deadlineAt);
    } catch (error) {
      lastError = error;
      if (isTerminalFetchError(error, attempt)) throw error;
      await waitForErrorRetry(url, error, attempt, deadlineAt);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to fetch the page.");
}

function createDecoder(charset: string): TextDecoder {
  try {
    return new TextDecoder(charset);
  } catch {
    return new TextDecoder("utf-8");
  }
}

export async function readResponseWithByteCap(
  response: Response,
  maxBytes: number,
  charset: string,
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return response.text();

  const decoder = createDecoder(charset);
  let totalBytes = 0;
  const chunks: string[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new ResponseTooLargeError(maxBytes);
    }
    chunks.push(decoder.decode(value, { stream: true }));
  }
  chunks.push(decoder.decode());
  return chunks.join("");
}
