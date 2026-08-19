import {
  MAX_CHARS_PER_SOURCE,
  MAX_CHARS_PER_WORD,
  MAX_WORDS_PER_SOURCE,
} from "@/shared/content/sources/constants";

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter((word) => word.length > 0).length;
}

interface TruncateSourceTextResult {
  text: string;
  warning: string | null;
}

// Markdown from Notion and other integrations can contain very long
// whitespace-delimited segments (URLs, link syntax) — split rather than dropped.
function splitLongToken(token: string): string {
  if (token.length <= MAX_CHARS_PER_WORD) return token;

  const pieces: string[] = [];
  for (let i = 0; i < token.length; i += MAX_CHARS_PER_WORD) {
    pieces.push(token.slice(i, i + MAX_CHARS_PER_WORD));
  }
  return pieces.join(" ");
}

function buildTruncationWarning(
  originalWordCount: number,
  originalCharCount: number,
  indexedWordCount: number,
  indexedCharCount: number,
): string {
  return [
    `This source exceeded indexing limits and was truncated to ${indexedWordCount.toLocaleString()} words (${indexedCharCount.toLocaleString()} characters).`,
    `Original size: ${originalWordCount.toLocaleString()} words, ${originalCharCount.toLocaleString()} characters.`,
    `Limits: ${MAX_WORDS_PER_SOURCE.toLocaleString()} words or ${MAX_CHARS_PER_SOURCE.toLocaleString()} characters per source.`,
  ].join(" ");
}

// Whitespace between words is the source's own: the paragraph breaks the
// sanitizer preserved are what the digest model outlines and what a Tier-1
// prompt quotes, so a source under the limits comes back unchanged.
export function truncateSourceText(text: string): TruncateSourceTextResult {
  const trimmed = text.trim();
  if (!trimmed) return { text: "", warning: null };

  const expanded = trimmed.replace(/\S+/g, splitLongToken);

  let words = 0;

  let kept = 0;
  let truncated = false;

  for (const match of expanded.matchAll(/\S+/g)) {
    const wordEnd = match.index + match[0].length;
    if (words === MAX_WORDS_PER_SOURCE || wordEnd > MAX_CHARS_PER_SOURCE) {
      truncated = true;
      break;
    }
    words += 1;
    kept = wordEnd;
  }

  if (!truncated) {
    return { text: expanded, warning: null };
  }

  const result = expanded.slice(0, kept);

  return {
    text: result,
    warning: buildTruncationWarning(
      countWords(trimmed),
      trimmed.length,
      words,
      result.length,
    ),
  };
}
