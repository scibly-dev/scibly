import type { ModelFormState } from "./org-ai-model-form";

import { describe, expect, it } from "vitest";

import { buildModelUpdatePayload } from "./build-model-update-payload";

const STORED = {
  name: "My endpoint",
  baseUrl: "https://api.example.com/v1",
  modelId: "gpt-4o-mini",
  contextWindow: 200_000,
};

function submit(overrides: Partial<ModelFormState> = {}): ModelFormState {
  return {
    name: STORED.name,
    baseUrl: STORED.baseUrl,
    modelId: STORED.modelId,
    apiKey: "",
    contextWindow: String(STORED.contextWindow),
    ...overrides,
  };
}

function payload(submitted: ModelFormState) {
  return buildModelUpdatePayload("acme", "model-1", STORED, submitted);
}

describe("the context window an edit sends", () => {
  it("stays out of the payload when the field was not touched", () => {
    expect(payload(submit())).toBeNull();
  });

  it("carries the new value as the string the wire schema parses", () => {
    expect(payload(submit({ contextWindow: "128000" }))).toMatchObject({
      contextWindow: "128000",
    });
  });

  it("clears the stored value when the field is emptied", () => {
    expect(payload(submit({ contextWindow: "" }))).toMatchObject({
      contextWindow: null,
    });
  });

  it("leaves an already-empty window alone", () => {
    const stored = { ...STORED, contextWindow: null };
    expect(
      buildModelUpdatePayload(
        "acme",
        "model-1",
        stored,
        submit({ contextWindow: "" }),
      ),
    ).toBeNull();
  });
});
