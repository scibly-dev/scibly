import { beforeEach, describe, expect, it, vi } from "vitest";

// The model call and model resolution are the only mocked pieces — the
// prompt, sampling and parser all run for real, since the parser's leniency
// for an arbitrary BYOAI endpoint is the point of this file.

const ai = vi.hoisted(() => ({ generateText: vi.fn() }));
const registry = vi.hoisted(() => ({ getLanguageModel: vi.fn() }));

vi.mock("ai", () => ai);
vi.mock("@/shared/ai/server/models/registry", () => registry);

const { generateSourceDigest } = await import("./source-digest");

const ORG_SLUG = "acme";

function modelReplies(text: string) {
  ai.generateText.mockResolvedValue({ text });
}

function promptSent(): string {
  return ai.generateText.mock.calls[0]?.[0]?.prompt ?? "";
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
  registry.getLanguageModel.mockResolvedValue({ model: "fake-model" });
  modelReplies('{"summary": "What it covers.", "outline": "- One\\n- Two"}');
});

describe("the two fields it asks for", () => {
  it("reads summary and outline out of a plain reply", async () => {
    expect(await generateSourceDigest("some text", ORG_SLUG)).toEqual({
      summary: "What it covers.",
      outline: "- One\n- Two",
      produced: true,
    });
  });

  it.each([
    ["a fenced block", '```json\n{"summary": "S.", "outline": "- One"}\n```'],
    [
      "a sentence in front",
      'Here you go:\n{"summary": "S.", "outline": "- One"}',
    ],
    [
      "trailing prose",
      '{"summary": "S.", "outline": "- One"}\nHope that helps!',
    ],
    ["padded values", '{"summary": "  S.  ", "outline": "\\n- One\\n"}'],
  ])("accepts %s", async (_label, reply) => {
    modelReplies(reply);

    const digest = await generateSourceDigest("some text", ORG_SLUG);

    expect(digest.summary).toBe("S.");
    expect(digest.outline).toBe("- One");
  });

  it("keeps the half it could find when the model omits the other", async () => {
    modelReplies('{"summary": "What it covers."}');

    expect(await generateSourceDigest("some text", ORG_SLUG)).toEqual({
      summary: "What it covers.",
      outline: null,
      produced: true,
    });
  });

  it("keeps the field that is well-formed when the other is not a string", async () => {
    modelReplies('{"summary": ["What", "it covers."], "outline": "- One"}');

    expect(await generateSourceDigest("some text", ORG_SLUG)).toEqual({
      summary: null,
      outline: "- One",
      produced: true,
    });
  });

  it("cuts a runaway field back to its last finished sentence", async () => {
    const runaway = "Sentence about the document. ".repeat(500);
    modelReplies(JSON.stringify({ summary: runaway }));

    const { summary } = await generateSourceDigest("some text", ORG_SLUG);

    expect(summary!.length).toBeLessThanOrEqual(4_000);
    expect(summary!.length).toBeGreaterThan(3_900);
    expect(summary!.endsWith("Sentence about the document.")).toBe(true);
  });

  it("reports no digest at all rather than storing a reply that is not JSON", async () => {
    modelReplies("I am not going to follow that format.");

    expect(await generateSourceDigest("some text", ORG_SLUG)).toEqual({
      summary: null,
      outline: null,
      produced: true,
    });
  });

  it("reports no digest at all when the object is truncated mid-string", async () => {
    modelReplies('{"summary": "What it cov');

    expect(await generateSourceDigest("some text", ORG_SLUG)).toEqual({
      summary: null,
      outline: null,
      produced: true,
    });
  });
});

// `produced` is what the ingest charge turns on: a reply we could not use was
// still a reply the provider billed for, while a call that never got one was not.
describe("a digest that cannot be produced", () => {
  it("returns nulls instead of failing the ingest that produced good text", async () => {
    ai.generateText.mockRejectedValue(new Error("model is down"));

    await expect(generateSourceDigest("some text", ORG_SLUG)).resolves.toEqual({
      summary: null,
      outline: null,
      produced: false,
    });
  });

  it("returns nulls when the organization's model cannot be resolved", async () => {
    registry.getLanguageModel.mockRejectedValue(new Error("no such model"));

    await expect(generateSourceDigest("some text", ORG_SLUG)).resolves.toEqual({
      summary: null,
      outline: null,
      produced: false,
    });
  });
});

describe("how much of the source it reads", () => {
  it("sends a short source verbatim", async () => {
    await generateSourceDigest("short source", ORG_SLUG);

    expect(promptSent()).toBe("short source");
  });

  it("samples across a long source instead of taking its head", async () => {
    const long = `${"a".repeat(100_000)}${"b".repeat(100_000)}${"c".repeat(100_000)}`;

    await generateSourceDigest(long, ORG_SLUG);

    const prompt = promptSent();
    expect(prompt.length).toBeLessThan(long.length);
    expect(prompt).toContain("a");
    expect(prompt).toContain("b");
    expect(prompt).toContain("c");
  });

  it("bounds what the model can bill by asking the provider for a ceiling", async () => {
    await generateSourceDigest("short source", ORG_SLUG);

    expect(ai.generateText.mock.calls[0]?.[0]?.maxOutputTokens).toBeGreaterThan(
      2_000,
    );
  });
});
