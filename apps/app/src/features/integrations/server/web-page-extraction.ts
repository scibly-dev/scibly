const ACCEPTED_CONTENT_TYPES = new Set([
  "text/html",
  "text/plain",
  "application/xhtml+xml",
]);

const BOT_BLOCK_PATTERNS = [
  /just a moment/i,
  /access denied/i,
  /cf-browser-verification/i,
  /enable javascript/i,
  /please enable cookies/i,
  /attention required/i,
  /checking your browser/i,
  /captcha/i,
  /bot detection/i,
  /unusual traffic/i,
];

export function parseCharset(contentType: string | null): string {
  const match = contentType?.match(/charset=([^;]+)/i);
  return match?.[1]?.trim().replace(/['"]/g, "") ?? "utf-8";
}

export function isAcceptedContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const normalized = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return ACCEPTED_CONTENT_TYPES.has(normalized);
}

export function acceptedContentTypes(): string[] {
  return [...ACCEPTED_CONTENT_TYPES];
}

export function looksLikeHtml(body: string): boolean {
  const trimmed = body.trimStart().slice(0, 256).toLowerCase();
  return (
    trimmed.startsWith("<!doctype html") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<head") ||
    trimmed.startsWith("<body")
  );
}

export function getExtractionSource(
  html: string,
): "main" | "article" | "body" | "full" {
  if (/<main[^>]*>/i.test(html)) return "main";
  if (/<article[^>]*>/i.test(html)) return "article";
  if (/<body[^>]*>/i.test(html)) return "body";
  return "full";
}

export function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return null;
  return match[1].replace(/\s+/g, " ").trim() || null;
}

export function extractMainHtml(html: string): string {
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch?.[1]) return mainMatch[1];
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch?.[1]) return articleMatch[1];
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch?.[1] ?? html;
}

export function detectBotBlock(
  html: string,
  title: string | null,
): string | null {
  const sample = `${title ?? ""}\n${html.slice(0, 4_096)}`;
  if (!BOT_BLOCK_PATTERNS.some((pattern) => pattern.test(sample))) return null;
  return "The page appears to require a browser challenge or blocked automated access.";
}
