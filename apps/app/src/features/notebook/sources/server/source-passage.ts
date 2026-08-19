export function toSourcePassage(
  tag: string,
  attributes: Record<string, string | number>,
  text: string,
): string {
  const quoted = text.replace(
    new RegExp(`<(/?)\\s*${tag}`, "gi"),
    (_, slash: string) => `&lt;${slash}${tag}`,
  );
  const attrs = Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${escapeAttribute(String(value))}"`)
    .join("");

  return `<${tag}${attrs}>\n${quoted}\n</${tag}>`;
}

export function quoteSourceName(name: string): string {
  return `"${escapeAttribute(name.replace(/\s+/g, " ").trim())}"`;
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
