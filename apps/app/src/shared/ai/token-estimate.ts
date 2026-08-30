// One flat ratio: organizations bring their own model endpoints, so no per-model tokenizer is available.
export const CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
