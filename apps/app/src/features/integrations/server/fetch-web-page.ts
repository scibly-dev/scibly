import {
  assertSafeResolvedOutboundUrl,
  UnsafeOutboundUrlError,
} from "@/lib/network/ssrf-guard";
import {
  MAX_CHARS_PER_WEB_FETCH,
  MAX_HTML_BYTES_PER_WEB_FETCH,
} from "@/shared/content/sources/constants";
import { sanitizeSourceTextForIndexing } from "@/shared/content/sources/sanitize-source-text";

import { htmlToMarkdown } from "./turndown";
import {
  acceptedContentTypes,
  detectBotBlock,
  extractMainHtml,
  extractTitle,
  getExtractionSource,
  isAcceptedContentType,
  looksLikeHtml,
  parseCharset,
} from "./web-page-extraction";
import {
  fetchPageWithRetries,
  readResponseWithByteCap,
  ResponseTooLargeError,
} from "./web-page-request";

export const LOG_PREFIX = "[fetchWebPage]";
const DEFAULT_ACCEPT_LANGUAGE = "en-US,en;q=0.9,*;q=0.8";
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const LOCALE_ACCEPT_LANGUAGE = new Map([
  ["de", "de-DE,de;q=0.9,en;q=0.8"],
  ["en", DEFAULT_ACCEPT_LANGUAGE],
  ["fr", "fr-FR,fr;q=0.9,en;q=0.8"],
  ["es", "es-ES,es;q=0.9,en;q=0.8"],
]);

type LogFields = Record<string, string | number | boolean | null | undefined>;

function logInfo(message: string, details?: LogFields) {
  console.log(LOG_PREFIX, message, ...(details ? [details] : []));
}

function logError(message: string, details?: LogFields, cause?: unknown) {
  console.error(
    LOG_PREFIX,
    message,
    ...(details ? [details] : []),
    ...(cause === undefined ? [] : [cause]),
  );
}

function resolveAcceptLanguageForUrl(url: string): string {
  try {
    const locale = new URL(url).pathname
      .match(/^\/(de|en|fr|es)(?:\/|$)/i)?.[1]
      ?.toLowerCase();
    const header = locale && LOCALE_ACCEPT_LANGUAGE.get(locale);
    if (header) return header;
  } catch {}
  return DEFAULT_ACCEPT_LANGUAGE;
}

function buildFetchHeaders(url: string): HeadersInit {
  const parsed = new URL(url);
  return {
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
    "Accept-Language": resolveAcceptLanguageForUrl(url),
    "Cache-Control": "no-cache",
    "Upgrade-Insecure-Requests": "1",
    "User-Agent": BROWSER_USER_AGENT,
    Referer: `${parsed.origin}/`,
  };
}

type FetchWebPageSuccess = {
  url: string;
  finalUrl: string;
  title: string | null;
  markdown: string;
  charCount: number;
  truncated: boolean;
  warning?: string;
};

type FetchWebPageOutcome = "REFUSED" | "UNREACHABLE" | "UNUSABLE";

type FetchWebPageError = {
  outcome: FetchWebPageOutcome;

  retry: boolean;

  message: string;
  error: string;
  url: string;
  finalUrl?: string;
};

export type FetchWebPageResult = FetchWebPageSuccess | FetchWebPageError;

const OUTCOME_GUIDANCE = {
  REFUSED:
    "That address was refused before any request was made. Do not try variations of it. Tell the author the URL cannot be fetched and ask for a different, public one.",
  UNREACHABLE:
    "The page could not be reached. You may try once more; if it fails again, tell the author and continue without it.",

  UNUSABLE:
    "The page responded but there was nothing usable to read. Do not fetch it again — tell the author what happened and ask them to paste the text or give a different URL.",
} satisfies Record<FetchWebPageOutcome, string>;

export function failure(
  outcome: FetchWebPageOutcome,
  error: string,
  location: { url: string; finalUrl?: string },

  message: string = OUTCOME_GUIDANCE[outcome],
): FetchWebPageError {
  return {
    outcome,
    retry: outcome === "UNREACHABLE",
    message,
    error,
    url: location.url,
    finalUrl: location.finalUrl,
  };
}

function isRetryableStatus(status: number): boolean {
  return status >= 500 || status === 408 || status === 429;
}

function truncateToCharLimit(text: string, maxChars: number) {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) {
    return { text: trimmed, truncated: false, warning: null };
  }
  return {
    text: trimmed.slice(0, maxChars).trimEnd(),
    truncated: true,
    warning: `Content was truncated to ${maxChars.toLocaleString()} characters for model context.`,
  };
}

function unsafeUrlResult(url: string, error: unknown): FetchWebPageError {
  const detail =
    error instanceof UnsafeOutboundUrlError
      ? error.message
      : "Invalid or unsafe URL.";
  logError("Blocked unsafe URL", { url, detail }, error);
  return failure("REFUSED", detail, { url });
}

async function requestPage(url: string) {
  try {
    return await fetchPageWithRetries(url, buildFetchHeaders(url));
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Failed to fetch the page.";
    logError(
      "Fetch request failed",
      {
        url,
        detail,
        errorName: error instanceof Error ? error.name : undefined,
      },
      error,
    );

    return error instanceof UnsafeOutboundUrlError
      ? unsafeUrlResult(url, error)
      : failure("UNREACHABLE", detail, { url });
  }
}

async function validateOutboundUrl(
  url: string,
): Promise<FetchWebPageError | null> {
  try {
    await assertSafeResolvedOutboundUrl(url, "strict");
    return null;
  } catch (error) {
    return unsafeUrlResult(url, error);
  }
}

function validateResponse(
  response: Response,
  context: { url: string; finalUrl: string; contentType: string | null },
): FetchWebPageError | null {
  const { url, finalUrl, contentType } = context;
  if (response.ok) return null;

  const detail = `Request failed (${response.status} ${response.statusText}).`;
  logError("Non-success HTTP status", {
    url,
    finalUrl,
    status: response.status,
    statusText: response.statusText,
    contentType,
  });
  return failure(
    isRetryableStatus(response.status) ? "UNREACHABLE" : "UNUSABLE",
    detail,
    { url, finalUrl },
  );
}

async function readPageBody(
  response: Response,
  context: { url: string; finalUrl: string; contentType: string | null },
): Promise<string | FetchWebPageError> {
  const { url, finalUrl, contentType } = context;
  try {
    return await readResponseWithByteCap(
      response,
      MAX_HTML_BYTES_PER_WEB_FETCH,
      parseCharset(contentType),
    );
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Failed to read response body.";
    logError("Failed to read response body", { url, finalUrl, detail }, error);

    return failure(
      error instanceof ResponseTooLargeError ? "UNUSABLE" : "UNREACHABLE",
      detail,
      { url, finalUrl },
    );
  }
}

function validatePageContent(
  rawHtml: string,
  context: { url: string; finalUrl: string; contentType: string | null },
): { title: string | null; extractionSource: string } | FetchWebPageError {
  const { url, finalUrl, contentType } = context;
  if (!isAcceptedContentType(contentType) && !looksLikeHtml(rawHtml)) {
    logError("Unsupported content type", {
      url,
      finalUrl,
      contentType,
      acceptedContentTypes: acceptedContentTypes().join(", "),
    });
    return failure("UNUSABLE", "Response is not HTML or plain text.", {
      url,
      finalUrl,
    });
  }

  const title = extractTitle(rawHtml);
  const botBlockMessage = detectBotBlock(rawHtml, title);
  if (botBlockMessage) {
    logError("Bot or challenge page detected", { url, finalUrl, title });
    return failure("UNUSABLE", botBlockMessage, { url, finalUrl });
  }
  return { title, extractionSource: getExtractionSource(rawHtml) };
}

function convertPageToMarkdown(
  rawHtml: string,
  context: { url: string; finalUrl: string; extractionSource: string },
): string | FetchWebPageError {
  const { url, finalUrl, extractionSource } = context;
  try {
    const markdown = sanitizeSourceTextForIndexing(
      htmlToMarkdown(extractMainHtml(rawHtml)),
    );
    if (markdown.trim()) return markdown;

    logError("No readable text extracted", { url, finalUrl });
    return failure(
      "UNUSABLE",
      "No readable text could be extracted from the page.",
      { url, finalUrl },
    );
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message
        : "Failed to convert HTML to markdown.";
    logError(
      "Turndown conversion failed",
      { url, finalUrl, detail, extractionSource },
      error,
    );
    return failure("UNUSABLE", detail, { url, finalUrl });
  }
}

export async function fetchWebPageAsMarkdown(
  url: string,
): Promise<FetchWebPageResult> {
  logInfo("Starting fetch", { url });
  const unsafeUrl = await validateOutboundUrl(url);
  if (unsafeUrl) return unsafeUrl;

  const request = await requestPage(url);
  if ("outcome" in request) return request;

  const { response, finalUrl, attempts } = request;
  const contentType = response.headers.get("content-type");
  logInfo("Fetch response received", {
    url,
    finalUrl,
    attempts,
    status: response.status,
    statusText: response.statusText,
    contentType,
    acceptLanguage: resolveAcceptLanguageForUrl(url),
  });
  const context = { url, finalUrl, contentType };
  const responseError = validateResponse(response, context);
  if (responseError) return responseError;

  const rawHtml = await readPageBody(response, context);
  if (typeof rawHtml !== "string") return rawHtml;
  const pageContent = validatePageContent(rawHtml, context);
  if ("outcome" in pageContent) return pageContent;
  const { title, extractionSource } = pageContent;
  const markdown = convertPageToMarkdown(rawHtml, {
    url,
    finalUrl,
    extractionSource,
  });
  if (typeof markdown !== "string") return markdown;

  const bounded = truncateToCharLimit(markdown, MAX_CHARS_PER_WEB_FETCH);
  logInfo("Fetch completed", {
    url,
    finalUrl,
    title,
    extractionSource,
    markdownChars: bounded.text.length,
    originalMarkdownChars: markdown.length,
    truncated: bounded.truncated,
  });
  return {
    url,
    finalUrl,
    title,
    markdown: bounded.text,
    charCount: bounded.text.length,
    truncated: bounded.truncated,
    warning: bounded.warning ?? undefined,
  };
}
