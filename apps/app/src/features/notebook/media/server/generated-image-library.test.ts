import { AppError } from "@scibly/api/application-error";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The db double interprets `listGeneratedImages`' query instead of stubbing a
// fixed return value, so GL2/GL3 can assert paging yields every image exactly once.

const db = vi.hoisted(() => ({
  notebookGeneratedImage: { findMany: vi.fn() },
}));
const access = vi.hoisted(() => ({ resolveNotebookInOrg: vi.fn() }));

vi.mock("@scibly/db", () => ({ db }));
vi.mock("@/features/notebook/workspace/server/access", () => access);

const { buildImageNotebookTools } =
  await import("../tools/image-notebook-tools");
const { GENERATED_IMAGE_PAGE_SIZE } = await import("../tools/image-schemas");

const USER = "user-1";
const ORG_SLUG = "acme";
const NOTEBOOK = "nb-1";
const OTHER_NOTEBOOK = "nb-2";

type Row = {
  id: string;
  notebookId: string;
  createdAt: Date;
  prompt: string;
  alt: string;
  s3Key: string;
  width: number | null;
  height: number | null;
  byteSize: number;
  aspectRatio: string | null;
  toolCallId: string | null;
};

type OrderKey = { createdAt?: "asc" | "desc"; id?: "asc" | "desc" };

type Clause = { createdAt?: Date | { lt: Date }; id?: { lt: string } };

type FindManyArgs = {
  where: Clause & { notebookId: string; OR?: Clause[] };
  orderBy: OrderKey[];
  take: number;
};

let library: Row[] = [];

function image(id: string, createdAt: string, notebookId = NOTEBOOK): Row {
  return {
    id,
    notebookId,
    createdAt: new Date(createdAt),
    prompt: `prompt for ${id}`,
    alt: `alt for ${id}`,
    s3Key: `notebook-media/org-a/${notebookId}/${id}.webp`,
    width: 1024,
    height: 576,
    byteSize: 4096,
    aspectRatio: "16:9",
    toolCallId: `call-${id}`,
  };
}

function matchesClause(row: Row, clause: Clause): boolean {
  if (clause.createdAt instanceof Date) {
    if (row.createdAt.getTime() !== clause.createdAt.getTime()) return false;
  } else if (clause.createdAt) {
    if (row.createdAt.getTime() >= clause.createdAt.lt.getTime()) return false;
  }
  if (clause.id && !(row.id < clause.id.lt)) return false;
  return true;
}

function keepsRow(row: Row, where: FindManyArgs["where"]): boolean {
  if (row.notebookId !== where.notebookId) return false;
  if (!matchesClause(row, where)) return false;
  return where.OR
    ? where.OR.some((clause) => matchesClause(row, clause))
    : true;
}

function sortRows(rows: Row[], orderBy: OrderKey[]): Row[] {
  return [...rows].sort((left, right) => {
    for (const key of orderBy) {
      const [field, direction] = Object.entries(key)[0] as [
        "createdAt" | "id",
        "asc" | "desc",
      ];
      const ascending =
        field === "createdAt"
          ? left.createdAt.getTime() - right.createdAt.getTime()
          : left.id.localeCompare(right.id);
      if (ascending === 0) continue;
      return direction === "desc" ? -ascending : ascending;
    }
    return 0;
  });
}

async function listMedia(input: { cursor?: string; limit?: number } = {}) {
  const tools = buildImageNotebookTools({
    notebookId: NOTEBOOK,
    orgSlug: ORG_SLUG,
    session: { user: { id: USER } },
  });
  const execute = tools.listNotebookMedia.execute;
  if (!execute) throw new Error("listNotebookMedia has no server executor");
  const result = await execute(input, {
    toolCallId: "call-list",
    messages: [],

    context: {},
  });
  if (Symbol.asyncIterator in result) {
    throw new Error("Listing the library returns one page, not a stream.");
  }
  return result;
}

async function pageThrough(limit: number) {
  const ids: string[] = [];
  let cursor: string | undefined;
  let pages = 0;

  do {
    const page = await listMedia({ cursor, limit });
    ids.push(...page.items.map((item) => item.id));
    cursor = page.nextCursor;
    pages += 1;
    if (pages > 20) throw new Error("pagination did not terminate");
  } while (cursor);

  return { ids, pages };
}

beforeEach(() => {
  vi.resetAllMocks();
  library = [];

  access.resolveNotebookInOrg.mockResolvedValue({
    notebook: { id: NOTEBOOK, organizationId: "org-a" },
  });
  db.notebookGeneratedImage.findMany.mockImplementation(
    async ({ where, orderBy, take }: FindManyArgs) =>
      sortRows(
        library.filter((row) => keepsRow(row, where)),
        orderBy,
      ).slice(0, take),
  );
});

describe("GL1 the library lists only this notebook's images, newest first", () => {
  it("GL1 returns the notebook's images newest first", async () => {
    library = [
      image("a", "2026-07-20T10:00:00.000Z"),
      image("b", "2026-07-21T10:00:00.000Z"),
      image("c", "2026-07-22T10:00:00.000Z"),
    ];

    const page = await listMedia();

    expect(page.items.map((item) => item.id)).toEqual(["c", "b", "a"]);
  });

  it("GL1 leaves out another notebook's images", async () => {
    library = [
      image("mine-old", "2026-07-20T10:00:00.000Z"),
      image("theirs", "2026-07-21T10:00:00.000Z", OTHER_NOTEBOOK),
      image("mine-new", "2026-07-22T10:00:00.000Z"),
    ];

    const page = await listMedia();

    expect(page.items.map((item) => item.id)).toEqual(["mine-new", "mine-old"]);
  });

  it("GL1 carries each image's alt text and prompt, so the agent can judge reuse", async () => {
    library = [image("a", "2026-07-20T10:00:00.000Z")];

    const [item] = (await listMedia()).items;

    expect(item).toMatchObject({
      id: "a",
      alt: "alt for a",
      prompt: "prompt for a",
      toolCallId: "call-a",
    });
    expect(item?.url).toContain("notebook-media/org-a/nb-1/a.webp");
  });
});

describe("GL2 a page is at most the requested size, and offers a cursor only when there is more", () => {
  it("GL2 fills a page and offers a cursor when older images remain", async () => {
    library = [
      image("a", "2026-07-20T10:00:00.000Z"),
      image("b", "2026-07-21T10:00:00.000Z"),
      image("c", "2026-07-22T10:00:00.000Z"),
    ];

    const page = await listMedia({ limit: 2 });

    expect(page.items.map((item) => item.id)).toEqual(["c", "b"]);
    expect(page.nextCursor).toBeDefined();
  });

  it("GL2 offers no cursor when the page is exactly the last of the library", async () => {
    library = [
      image("a", "2026-07-20T10:00:00.000Z"),
      image("b", "2026-07-21T10:00:00.000Z"),
    ];

    const page = await listMedia({ limit: 2 });

    expect(page.items.map((item) => item.id)).toEqual(["b", "a"]);
    expect(page.nextCursor).toBeUndefined();
  });

  it("GL2 offers no cursor for a partial page", async () => {
    library = [image("a", "2026-07-20T10:00:00.000Z")];

    const page = await listMedia({ limit: 2 });

    expect(page.items).toHaveLength(1);
    expect(page.nextCursor).toBeUndefined();
  });

  it("GL2 offers no cursor for an empty library", async () => {
    const page = await listMedia({ limit: 2 });

    expect(page.items).toEqual([]);
    expect(page.nextCursor).toBeUndefined();
  });

  it("GL2 falls back to the default page size when the caller names none", async () => {
    library = Array.from({ length: GENERATED_IMAGE_PAGE_SIZE + 1 }, (_, i) =>
      image(
        `img-${String(i).padStart(2, "0")}`,
        new Date(
          Date.UTC(2026, 6, 20, 10, i) /* one image a minute */,
        ).toISOString(),
      ),
    );

    const page = await listMedia();

    expect(page.items).toHaveLength(GENERATED_IMAGE_PAGE_SIZE);
    expect(page.nextCursor).toBeDefined();
  });
});

describe("GL3 the next page resumes strictly after the last image shown", () => {
  it("GL3 pages through the whole library once, in order", async () => {
    library = [
      image("a", "2026-07-20T10:00:00.000Z"),
      image("b", "2026-07-21T10:00:00.000Z"),
      image("c", "2026-07-22T10:00:00.000Z"),
      image("d", "2026-07-23T10:00:00.000Z"),
      image("e", "2026-07-24T10:00:00.000Z"),
    ];

    const { ids, pages } = await pageThrough(2);

    expect(ids).toEqual(["e", "d", "c", "b", "a"]);
    expect(pages).toBe(3);
  });

  it("GL3 does not repeat or skip images that share a timestamp across a page boundary", async () => {
    const sameSecond = "2026-07-22T10:00:00.000Z";
    library = [
      image("img-1", sameSecond),
      image("img-2", sameSecond),
      image("img-3", sameSecond),
      image("older", "2026-07-21T10:00:00.000Z"),
    ];

    const { ids } = await pageThrough(2);

    expect(ids).toEqual(["img-3", "img-2", "img-1", "older"]);
  });

  it("GL3 resumes after a boundary where every remaining image shares the last one's timestamp", async () => {
    const sameSecond = "2026-07-22T10:00:00.000Z";
    library = [
      image("img-1", sameSecond),
      image("img-2", sameSecond),
      image("img-3", sameSecond),
    ];

    const first = await listMedia({ limit: 2 });
    const second = await listMedia({ cursor: first.nextCursor, limit: 2 });

    expect(first.items.map((item) => item.id)).toEqual(["img-3", "img-2"]);
    expect(second.items.map((item) => item.id)).toEqual(["img-1"]);
    expect(second.nextCursor).toBeUndefined();
  });
});

describe("GL4 an unreadable cursor is refused, not silently restarted", () => {
  const unreadable = [
    ["no separator", "2026-07-22T10:00:00.000Z"],
    ["no timestamp", "|img-1"],
    ["no id", "2026-07-22T10:00:00.000Z|"],
    ["an unparseable timestamp", "yesterday|img-1"],
  ] as const;

  it.each(unreadable)("GL4 refuses a cursor with %s", async (_case, cursor) => {
    library = [image("a", "2026-07-20T10:00:00.000Z")];

    await expect(listMedia({ cursor })).rejects.toMatchObject({
      code: "BAD_REQUEST",
      applicationCode: "api.bad_request",
    });
  });

  it("GL4 refuses rather than returning the first page again", async () => {
    library = [image("a", "2026-07-20T10:00:00.000Z")];

    await expect(listMedia({ cursor: "broken" })).rejects.toBeInstanceOf(
      AppError,
    );
    expect(db.notebookGeneratedImage.findMany).not.toHaveBeenCalled();
  });
});
