import { createTestPrismaClient } from "@scibly/db/test-client";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

// Opt-in: set SOURCES_INT_TEST_DATABASE_URL to a disposable database (see
// docs/integration-tests.md); skipped when unset.
const url = vi.hoisted(() => process.env.SOURCES_INT_TEST_DATABASE_URL ?? "");

// The functions under test read the app's singleton client, which is pinned to
// a fake URL in the test setup — point it at the disposable database instead.
vi.mock("@scibly/db", async () => {
  const { createTestPrismaClient: create } =
    await import("@scibly/db/test-client");
  return { db: create(url) };
});

const { readNotebookSource, searchNotebookSources } =
  await import("./search-sources");

const RUN_ID = `int-sources-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const ORG = `${RUN_ID}-org`;
const ACTOR = `${RUN_ID}-actor`;
const NOTEBOOK = `${RUN_ID}-nb`;
const OTHER_NOTEBOOK = `${RUN_ID}-nb-other`;
const SOURCE = `${RUN_ID}-src`;
const LONG_SOURCE = `${RUN_ID}-src-long`;

const NEEDLE = "mitochondria";
const LEAD = "A cell has many compartments. ".repeat(40);
const SENTENCE = `The ${NEEDLE} produce almost all of the cell's ATP.`;
const DOCUMENT = `${LEAD}${SENTENCE} ${"Ribosomes translate mRNA. ".repeat(40)}`;

const LONG_DOCUMENT = "abcdefghij".repeat(12_000);

describe.runIf(url !== "")("searching and reading real source text", () => {
  const db = createTestPrismaClient(url);

  beforeAll(async () => {
    await db.user.create({
      data: {
        id: ACTOR,
        name: "Integration Actor",
        email: `${ACTOR}@int-test.local`,
      },
    });
    await db.organization.create({
      data: {
        id: ORG,
        name: "Integration Org",
        slug: ORG,
        createdAt: new Date(),
      },
    });
    await db.notebook.createMany({
      data: [NOTEBOOK, OTHER_NOTEBOOK].map((id) => ({
        id,
        title: id,
        organizationId: ORG,
        userId: ACTOR,
      })),
    });
    await db.notebookSource.createMany({
      data: [
        {
          id: SOURCE,
          notebookId: NOTEBOOK,
          name: "Cell Biology.pdf",
          type: "TEXT",
          status: "READY",
          content: DOCUMENT,
          tokenCount: Math.ceil(DOCUMENT.length / 4),
        },
        {
          id: LONG_SOURCE,
          notebookId: NOTEBOOK,
          name: "Long Transcript.txt",
          type: "TEXT",
          status: "READY",
          content: LONG_DOCUMENT,
          tokenCount: Math.ceil(LONG_DOCUMENT.length / 4),
        },
        {
          id: `${RUN_ID}-src-other`,
          notebookId: OTHER_NOTEBOOK,
          name: "Unrelated.txt",
          type: "TEXT",
          status: "READY",
          content: "Roman aqueducts carried water for miles.",
          tokenCount: 10,
        },
      ],
    });
  });

  afterAll(async () => {
    await db.organization.delete({ where: { id: ORG } });
    await db.user.delete({ where: { id: ACTOR } });
    await db.$disconnect();
  });

  it("returns snippets tagged with their source, at offsets that point at the text", async () => {
    const outcome = await searchNotebookSources(NOTEBOOK, NEEDLE);

    if (outcome.status !== "MATCHED") {
      throw new Error(`Expected a match, got ${outcome.status}`);
    }
    const hit = outcome.matches.find((match) => match.content.includes(NEEDLE));
    if (!hit) throw new Error("Expected a match containing the needle");
    expect(hit.sourceId).toBe(SOURCE);
    expect(hit.sourceName).toBe("Cell Biology.pdf");

    if (hit.offset === null) throw new Error("Expected a located offset");
    expect(DOCUMENT.slice(hit.offset, hit.offset + hit.content.length)).toBe(
      hit.content,
    );
  });

  it("does not reach a source in another notebook", async () => {
    expect(await searchNotebookSources(OTHER_NOTEBOOK, NEEDLE)).toEqual({
      status: "BELOW_RELEVANCE_FLOOR",
    });
  });

  it("pages a 120k-char source to its end in three reads", async () => {
    const pages: string[] = [];
    let offset = 0;

    for (let call = 0; call < 5; call++) {
      const result = await readNotebookSource(NOTEBOOK, LONG_SOURCE, offset);
      if (result.status !== "READ") {
        throw new Error(`Expected a page, got ${result.status}`);
      }
      const [header] = result.passage.split("\n\n");
      const body = result.passage
        .slice(result.passage.indexOf(">\n") + 2)
        .replace(/\n<\/source>$/, "");
      pages.push(body);
      offset += body.length;
      if (header!.includes("That is the end of the source.")) break;
    }

    expect(pages).toHaveLength(3);
    expect(pages.join("")).toBe(LONG_DOCUMENT);
  });

  it("reads a source in another notebook as absent rather than forbidden", async () => {
    expect(await readNotebookSource(OTHER_NOTEBOOK, SOURCE, 0)).toEqual({
      status: "NOT_FOUND",
    });
  });
});
