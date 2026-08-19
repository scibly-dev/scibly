import { beforeEach, describe, expect, it, vi } from "vitest";

// Only the Notion SDK client is mocked; `fetchPageContent` itself runs for
// real so this file can assert on how it combines the two calls it fans out.

const client = vi.hoisted(() => ({
  pages: { retrieve: vi.fn(), retrieveMarkdown: vi.fn() },
}));

vi.mock("@notionhq/client", async () => {
  const actual = await vi.importActual("@notionhq/client");
  return {
    ...actual,
    Client: vi.fn().mockImplementation(function notionClient() {
      return client;
    }),
  };
});
vi.mock("@/env", () => ({
  env: {
    NOTION_CLIENT_ID: "test-client-id",
    NOTION_CLIENT_SECRET: "test-secret",
  },
}));

const { NotionProvider } = await import("./notion");

const PAGE_ID = "notion-page-1";

const FULL_PAGE = {
  object: "page",
  id: PAGE_ID,
  url: `https://notion.so/${PAGE_ID}`,
  properties: { title: { type: "title", title: [] } },
  last_edited_time: "2026-07-20T10:00:00.000Z",
};

function fullPage(overrides: Partial<typeof FULL_PAGE> = {}) {
  return { ...FULL_PAGE, ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  client.pages.retrieveMarkdown.mockResolvedValue({ markdown: "Body text." });
});

describe("NI1: fetchPageContent's lastEdited", () => {
  it("carries Notion's own last_edited_time, not the moment the fetch ran", async () => {
    client.pages.retrieve.mockResolvedValue(fullPage());

    const content = await new NotionProvider().fetchPageContent(
      "token",
      PAGE_ID,
    );

    expect(content.lastEdited).toEqual(new Date("2026-07-20T10:00:00.000Z"));
  });

  it("falls back to now only when Notion returns a partial page", async () => {
    client.pages.retrieve.mockResolvedValue({ object: "page", id: PAGE_ID });

    const before = Date.now();
    const content = await new NotionProvider().fetchPageContent(
      "token",
      PAGE_ID,
    );
    const after = Date.now();

    expect(content.lastEdited.getTime()).toBeGreaterThanOrEqual(before);
    expect(content.lastEdited.getTime()).toBeLessThanOrEqual(after);
  });

  it("always returns a lastEdited — never undefined — since callers may no longer guard for it", async () => {
    client.pages.retrieve.mockResolvedValue(fullPage());

    const content = await new NotionProvider().fetchPageContent(
      "token",
      PAGE_ID,
    );

    expect(content.lastEdited).toBeInstanceOf(Date);
  });
});
