// Strips non-text media — Notion markdown especially embeds long signed S3/data
// URLs that waste the prompt's source budget — and null bytes, which some PDF
// extractors leave behind and PostgreSQL text columns reject (error 22021).
export function sanitizeSourceTextForIndexing(text: string): string {
  return text
    .replace(/\0/g, "")

    .replace(/!\[[^\]]*]\([^)]+\)/g, "")

    .replace(/<img\b[^>]*>/gi, "")

    .replace(/<empty-block\s*\/?>/gi, "")

    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim();
}
