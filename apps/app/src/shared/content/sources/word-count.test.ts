import { describe, expect, it } from "vitest";

import {
  MAX_CHARS_PER_WORD,
  MAX_WORDS_PER_SOURCE,
} from "@/shared/content/sources/constants";
import {
  countWords,
  truncateSourceText,
} from "@/shared/content/sources/word-count";

describe("truncateSourceText", () => {
  it("returns a source within the limits unchanged", () => {
    const markdown = "# Photosynthesis\n\nLight in.\n\n- Chloroplast\n- Stroma";

    expect(truncateSourceText(markdown)).toEqual({
      text: markdown,
      warning: null,
    });
  });

  it("trims the ends but keeps the structure between them", () => {
    expect(truncateSourceText("\n  one\n\ntwo  \n").text).toBe("one\n\ntwo");
  });

  it("splits an unbroken segment too long to index", () => {
    const url = `https://example.com/${"a".repeat(MAX_CHARS_PER_WORD * 2)}`;

    const { text, warning } = truncateSourceText(`See ${url}\n\nEnd`);

    expect(warning).toBeNull();
    expect(text.startsWith("See ")).toBe(true);
    expect(text.endsWith("\n\nEnd")).toBe(true);
    for (const token of text.split(/\s+/)) {
      expect(token.length).toBeLessThanOrEqual(MAX_CHARS_PER_WORD);
    }
  });

  it("cuts an over-long source at a word boundary and says so", () => {
    const overLimit = Array.from(
      { length: MAX_WORDS_PER_SOURCE + 10 },
      (_, i) => `word${i}`,
    ).join("\n");

    const { text, warning } = truncateSourceText(overLimit);

    expect(countWords(text)).toBe(MAX_WORDS_PER_SOURCE);
    expect(text.endsWith(`word${MAX_WORDS_PER_SOURCE - 1}`)).toBe(true);
    expect(warning).toContain("exceeded indexing limits");
  });

  it("reports nothing for an empty source", () => {
    expect(truncateSourceText("   \n  ")).toEqual({ text: "", warning: null });
  });
});
