import type * as Ai from "ai";

import { beforeEach, describe, expect, it, vi } from "vitest";

const ai = vi.hoisted(() => ({ generateText: vi.fn() }));
const registry = vi.hoisted(() => ({ getLanguageModel: vi.fn() }));
const charge = vi.hoisted(() => ({ fundGeneration: vi.fn() }));

vi.mock("@scibly/db", () => ({ db: {} }));
vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof Ai>()),
  ...ai,
}));
vi.mock("@/shared/ai/server/models/registry", () => registry);
vi.mock("./charge-generation", () => charge);

const { assertNotTruncated, meteredGenerateText } =
  await import("./metered-text");

const spend = {
  organizationId: "org-1",
  actorId: null,
  action: "KNOWLEDGE_EXTRACT" as const,
  orgSlug: "acme",
};

beforeEach(() => {
  vi.clearAllMocks();
  ai.generateText.mockResolvedValue({ text: "hello", finishReason: "stop" });
  registry.getLanguageModel.mockResolvedValue({
    model: "gateway",
    isByoai: false,
  });
  charge.fundGeneration.mockImplementation(
    (_params: unknown, operation: (c: null) => Promise<unknown>) =>
      operation(null),
  );
});

describe("the model call the app is allowed to make", () => {
  it("resolves the organization's model and hands it the caller's options", async () => {
    expect(await meteredGenerateText(spend, { prompt: "why?" })).toBe("hello");

    expect(registry.getLanguageModel).toHaveBeenCalledWith(
      undefined,
      "acme",
      undefined,
    );
    expect(ai.generateText).toHaveBeenCalledWith({
      model: "gateway",
      prompt: "why?",
    });
  });

  it("bills an organization on its own endpoint to its own provider, not to us", async () => {
    registry.getLanguageModel.mockResolvedValue({
      model: "byoai",
      isByoai: true,
    });

    await meteredGenerateText(spend, { prompt: "why?" });

    expect(charge.fundGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        action: "KNOWLEDGE_EXTRACT",
        ownEndpoint: true,
      }),
      expect.any(Function),
    );
  });
});

describe("what the caller does with a reply is part of the generation", () => {
  it("runs `use` inside the funded window, so a failed read is refunded", async () => {
    let inside = false;
    charge.fundGeneration.mockImplementation(
      async (_params: unknown, operation: (c: null) => Promise<unknown>) => {
        try {
          return await operation(null);
        } catch (error) {
          inside = true;
          throw error;
        }
      },
    );

    await expect(
      meteredGenerateText(spend, { prompt: "why?" }, () => {
        throw new Error("unreadable");
      }),
    ).rejects.toThrow("unreadable");
    expect(inside).toBe(true);
  });

  it("returns what `use` made of the reply", async () => {
    expect(
      await meteredGenerateText(spend, { prompt: "why?" }, (reply) =>
        reply.text.toUpperCase(),
      ),
    ).toBe("HELLO");
  });
});

describe("a truncated reply is half an answer, not a short one", () => {
  it("rejects one the provider cut off", () => {
    expect(() =>
      assertNotTruncated({ finishReason: "length" } as never, "Triage"),
    ).toThrow(/cut off/);
  });

  it("lets a reply that finished through", () => {
    expect(() =>
      assertNotTruncated({ finishReason: "stop" } as never, "Triage"),
    ).not.toThrow();
  });
});
