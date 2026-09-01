/**
 * A passage escapes every tag, not just its own: they share one prompt, so a
 * `<pull-request>` emitting a bare `<topic>` could forge a fence it does not own.
 * Add a tag here in the same change that starts using it.
 */
const RESERVED_TAGS = [
  "conversation-summary",
  "previous-summary",
  "pull-request",
  "source",
  "source-digest",
  "source-passage",
  "topic",
] as const;

// Longest first, so `source-digest` is matched before `source` and the escape
// keeps the whole tag name rather than splitting it.
const reservedPattern = [...RESERVED_TAGS]
  .sort((a, b) => b.length - a.length)
  .join("|");

export function toSourcePassage(
  tag: string,
  attributes: Record<string, string | number>,
  text: string,
): string {
  const tags = RESERVED_TAGS.some((reserved) => reserved === tag)
    ? reservedPattern
    : `${escapeRegExp(tag)}|${reservedPattern}`;
  const quoted = text.replace(
    new RegExp(`<(/?)\\s*(${tags})\\b`, "gi"),
    (_, slash: string, name: string) => `&lt;${slash}${name}`,
  );
  const attrs = Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${escapeAttribute(String(value))}"`)
    .join("");

  return `<${tag}${attrs}>\n${quoted}\n</${tag}>`;
}

export function quoteSourceName(name: string): string {
  return `"${escapeAttribute(name.replace(/\s+/g, " ").trim())}"`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\-]/g, "\\$&");
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
