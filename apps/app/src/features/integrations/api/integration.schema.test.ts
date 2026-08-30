import { describe, expect, it } from "vitest";

import { linkPagesSchema } from "./integration.schema";

// The url is stored and later rendered as an `href`, so the schema has to reject a scheme the browser would execute.
describe("linkPagesSchema page url", () => {
  const link = (url: string) =>
    linkPagesSchema.safeParse({
      notebookId: "n1",
      orgSlug: "acme",
      provider: "NOTION",
      pages: [{ id: "p1", title: "Roadmap", url }],
    }).success;

  it("takes an https page", () => {
    expect(link("https://www.notion.so/Roadmap-abc123")).toBe(true);
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "http://www.notion.so/Roadmap-abc123",
  ])("refuses %s", (url) => {
    expect(link(url)).toBe(false);
  });
});
