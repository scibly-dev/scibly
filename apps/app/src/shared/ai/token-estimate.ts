// A single ratio stands in for tokenization since organizations bring their own
// endpoints and no per-model tokenizer is available; downstream consumers
// budget well inside the real window, so the approximation error is absorbed,
// not paid for.
const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
