import { describe, expect, it } from "vitest";

import { linkPageSchema } from "./integration.schema";

// The url a provider hands back is stored and later rendered as an `href`, so
// the schema is the first of the two places that has to reject a scheme the
// browser would execute. (The second is the anchor in
// `source-list-item-actions.tsx`, which guards rows written before this.)
describe("linkPageSchema pageUrl", () => {
  const link = (pageUrl: string) =>
    linkPageSchema.safeParse({
      notebookId: "n1",
      orgSlug: "acme",
      provider: "NOTION",
      pageId: "p1",
      pageTitle: "Roadmap",
      pageUrl,
    }).success;

  it("takes an https page", () => {
    expect(link("https://www.notion.so/Roadmap-abc123")).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "http://www.notion.so/Roadmap-abc123",
  ])("refuses %s", (pageUrl) => {
    expect(link(pageUrl)).toBe(false);
  });
});
