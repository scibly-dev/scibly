import { describe, expect, it } from "vitest";

import { buildEmbedSnippet, EMBED_LANGUAGE_AUTO } from "./snippet";

const snippet = (overrides: Partial<Parameters<typeof buildEmbedSnippet>[0]>) =>
  buildEmbedSnippet({
    appOrigin: "https://app.scibly.io",
    courseId: "abc",
    lang: EMBED_LANGUAGE_AUTO,
    courseTitle: "Fire Safety",
    heightPx: 600,
    includeScript: true,
    ...overrides,
  });

describe("embed snippet", () => {
  it("pins the course to a language only when one was named", () => {
    expect(snippet({})).toContain(
      'src="https://app.scibly.io/embed/courses/abc"',
    );
    expect(snippet({ lang: "de" })).toContain(
      'src="https://app.scibly.io/de/embed/courses/abc"',
    );
  });

  it("is the two tags a customer pastes, exactly", () => {
    expect(snippet({})).toBe(
      [
        "<iframe",
        '  src="https://app.scibly.io/embed/courses/abc"',
        '  title="Fire Safety"',
        "  data-scibly-embed",
        '  width="640"',
        '  height="600"',
        '  style="width: 100%; height: 600px; border: 0;"',
        '  allow="autoplay"',
        '  referrerpolicy="strict-origin-when-cross-origin"',
        '  loading="lazy"',
        "></iframe>",
        '<script src="https://app.scibly.io/embed/v1.js" async></script>',
      ].join("\n"),
    );
  });

  it("drops only the script when the customer declined it", () => {
    expect(snippet({ includeScript: false })).toBe(
      snippet({}).split("\n<script")[0],
    );
  });

  it("escapes a course title so it cannot break out of the title attribute", () => {
    expect(snippet({ courseTitle: `&<>"'` })).toContain(
      'title="&amp;&lt;&gt;&quot;&#39;"',
    );
  });
});
