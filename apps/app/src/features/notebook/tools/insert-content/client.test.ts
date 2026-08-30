import type {
  ClientToolCall,
  ClientToolContext,
  ClientToolOutput,
  GetSceneContentClientOutput,
  InsertContentClientOutput,
} from "./client-types";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { handleClientToolCall } from "./client";

// Reading, writing, validating and normalizing all happen behind one server
// procedure with its own tests in `scenes/editor/document-synchronization/server`;
// these tests cover only the routing.

const ACTIVE_SCENE = "scene_active";
const OTHER_SCENE = "scene_other";

const CLEAN_HTML =
  '<div data-type="custom-guide-character"><p>Ready to start?</p></div>';

function harness(overrides: Partial<ClientToolContext> = {}) {
  const outputs: ClientToolOutput[] = [];
  const recordSceneLineage = vi.fn().mockResolvedValue(undefined);
  const writeSceneContent = vi.fn().mockResolvedValue(undefined);
  const readSceneContent = vi
    .fn()
    .mockResolvedValue({ html: "<p>existing</p>", sourceIds: [] });
  const ctx: ClientToolContext = {
    activeSceneId: ACTIVE_SCENE,
    readSceneContent,
    writeSceneContent,
    addToolOutput: (output) => outputs.push(output),
    recordSceneLineage,
    hasLinkedNotebook: false,
    ...overrides,
  };
  return { ctx, outputs, recordSceneLineage, writeSceneContent };
}

function insertCall(
  input: ClientToolCall["input"] = { html: CLEAN_HTML },
): ClientToolCall {
  return { toolName: "insertContent", toolCallId: "call_1", input };
}

function readCall(input: ClientToolCall["input"] = {}): ClientToolCall {
  return { toolName: "getSceneContent", toolCallId: "call_1", input };
}

const asInsert = (output: ClientToolOutput) =>
  output as InsertContentClientOutput;
const asRead = (output: ClientToolOutput) =>
  output as GetSceneContentClientOutput;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DT1/DT2/DT3/DT4 — which scene a write lands in", () => {
  it("DT1: a write naming no scene lands in the scene the author is looking at", async () => {
    const { ctx, outputs, writeSceneContent } = harness();

    await handleClientToolCall(insertCall(), ctx);

    expect(asInsert(outputs[0]).success).toBe(true);
    expect(writeSceneContent).toHaveBeenCalledWith({
      sceneId: ACTIVE_SCENE,
      html: CLEAN_HTML,
      mode: "replace",
    });
  });

  it("DT1: a write to the scene the author has open still goes through the server", async () => {
    const { ctx, writeSceneContent } = harness();

    await handleClientToolCall(
      insertCall({ sceneId: ACTIVE_SCENE, html: CLEAN_HTML }),
      ctx,
    );

    // The open editor is a collaborator on the same room, so it receives this
    // write like any other.
    expect(writeSceneContent).toHaveBeenCalledWith(
      expect.objectContaining({ sceneId: ACTIVE_SCENE }),
    );
  });

  it("DT2: with no scene named and no scene open, the write is refused", async () => {
    const { ctx, outputs, writeSceneContent } = harness({
      activeSceneId: undefined,
    });

    await handleClientToolCall(insertCall(), ctx);

    expect(asInsert(outputs[0]).success).toBe(false);
    expect(asInsert(outputs[0]).error).toContain("No active scene");
    expect(writeSceneContent).not.toHaveBeenCalled();
  });

  it("DT4: a write to a scene that is not open is addressed to that scene, not the active one", async () => {
    const { ctx, writeSceneContent } = harness();

    await handleClientToolCall(
      insertCall({ sceneId: OTHER_SCENE, html: CLEAN_HTML }),
      ctx,
    );

    expect(writeSceneContent).toHaveBeenCalledWith(
      expect.objectContaining({ sceneId: OTHER_SCENE }),
    );
  });

  it("DT3: a write the server refuses is reported as a failed write", async () => {
    const { ctx, outputs } = harness({
      writeSceneContent: vi
        .fn()
        .mockRejectedValue(
          new Error("Authentication failed for scene scene_missing: forbidden"),
        ),
    });

    await handleClientToolCall(
      insertCall({ sceneId: "scene_missing", html: CLEAN_HTML }),
      ctx,
    );

    expect(asInsert(outputs[0]).success).toBe(false);
    expect(asInsert(outputs[0]).error).toContain("Authentication failed");
  });

  it("DT3: a write that never reaches the server is reported as a failed write", async () => {
    const { ctx, outputs } = harness({
      writeSceneContent: vi
        .fn()
        .mockRejectedValue(new Error("socket exploded")),
    });

    await handleClientToolCall(
      insertCall({ sceneId: OTHER_SCENE, html: CLEAN_HTML }),
      ctx,
    );

    expect(asInsert(outputs[0]).success).toBe(false);
    expect(asInsert(outputs[0]).error).toContain("socket exploded");
  });
});

describe("DQ1/DQ2/DQ3 — what the agent is told afterwards", () => {
  it("DQ1: a write citing no sources lands, and says the scene is ungrounded", async () => {
    const { ctx, outputs } = harness({ hasLinkedNotebook: true });

    await handleClientToolCall(insertCall(), ctx);

    expect(asInsert(outputs[0]).success).toBe(true);
    expect(asInsert(outputs[0]).groundingWarning).toContain("sourceIds");
  });

  it("DQ1: a write citing sources carries no grounding warning", async () => {
    const { ctx, outputs } = harness({ hasLinkedNotebook: true });

    await handleClientToolCall(
      insertCall({ html: CLEAN_HTML, sourceIds: ["src_1"] }),
      ctx,
    );

    expect(asInsert(outputs[0]).groundingWarning).toBeUndefined();
  });

  it("DQ1: a notebook with no sources is not nagged about grounding", async () => {
    const { ctx, outputs } = harness({ hasLinkedNotebook: false });

    await handleClientToolCall(insertCall(), ctx);

    expect(asInsert(outputs[0]).groundingWarning).toBeUndefined();
  });

  it("DQ2: lineage is recorded against the scene that was written", async () => {
    const { ctx, recordSceneLineage } = harness();

    await handleClientToolCall(
      insertCall({
        sceneId: OTHER_SCENE,
        html: CLEAN_HTML,
        sourceIds: ["src_1", "src_2"],
      }),
      ctx,
    );

    expect(recordSceneLineage).toHaveBeenCalledWith({
      sceneId: OTHER_SCENE,
      sourceIds: ["src_1", "src_2"],
    });
  });

  it("DQ2: a write whose lineage could not be recorded still lands, and says so", async () => {
    const { ctx, outputs, recordSceneLineage } = harness();
    recordSceneLineage.mockRejectedValue(new Error("lineage write failed"));

    await handleClientToolCall(
      insertCall({ html: CLEAN_HTML, sourceIds: ["src_1"] }),
      ctx,
    );

    expect(asInsert(outputs[0]).success).toBe(true);
    expect(asInsert(outputs[0]).lineageWarning).toContain(
      "lineage write failed",
    );
  });

  it("DQ2: no lineage is recorded for a write that did not land", async () => {
    const { ctx, recordSceneLineage } = harness({
      writeSceneContent: vi.fn().mockRejectedValue(new Error("refused")),
    });

    await handleClientToolCall(
      insertCall({
        sceneId: OTHER_SCENE,
        html: CLEAN_HTML,
        sourceIds: ["src_1"],
      }),
      ctx,
    );

    expect(recordSceneLineage).not.toHaveBeenCalled();
  });

  it("DQ3: a scene that breaks the quality rules is still written, with the rules named", async () => {
    const { ctx, outputs } = harness();

    await handleClientToolCall(
      insertCall({ html: "<h1>A chapter heading</h1><p>Some prose.</p>" }),
      ctx,
    );

    expect(asInsert(outputs[0]).success).toBe(true);
    expect(asInsert(outputs[0]).qualityWarning).toContain("heading");
  });

  it("DQ3: a scene that passes the quality rules carries no quality warning", async () => {
    const { ctx, outputs } = harness();

    await handleClientToolCall(insertCall(), ctx);

    expect(asInsert(outputs[0]).qualityWarning).toBeUndefined();
  });

  it("DQ1/DQ3: a refused write carries no advice about content that does not exist", async () => {
    const { ctx, outputs } = harness({
      hasLinkedNotebook: true,
      writeSceneContent: vi
        .fn()
        .mockRejectedValue(new Error("Unknown block type(s): quiz.")),
    });

    await handleClientToolCall(
      insertCall({ html: '<div data-type="quiz"><h1>Q</h1></div>' }),
      ctx,
    );

    const output = asInsert(outputs[0]);
    expect(output.success).toBe(false);
    expect(output.groundingWarning).toBeUndefined();
    expect(output.qualityWarning).toBeUndefined();
  });
});

describe("DR1 — a failed read is a failure, not an empty scene", () => {
  it("DR1: a read that failed reports no content at all", async () => {
    const { ctx, outputs } = harness({
      readSceneContent: vi
        .fn()
        .mockRejectedValue(new Error("connection timed out")),
    });

    await handleClientToolCall(readCall({ sceneId: OTHER_SCENE }), ctx);

    const output = asRead(outputs[0]);
    expect(output.error).toContain("connection timed out");
    expect(output.html).toBeUndefined();
  });

  it("DR1: a read that could not resolve a scene reports no content at all", async () => {
    const { ctx, outputs } = harness({ activeSceneId: undefined });

    await handleClientToolCall(readCall(), ctx);

    const output = asRead(outputs[0]);
    expect(output.error).toContain("No active scene");
    expect(output.html).toBeUndefined();
  });

  it("DR1: a genuinely empty scene reads as empty content with no error", async () => {
    const { ctx, outputs } = harness({
      readSceneContent: vi.fn().mockResolvedValue({ html: "", sourceIds: [] }),
    });

    await handleClientToolCall(readCall({ sceneId: OTHER_SCENE }), ctx);

    const output = asRead(outputs[0]);
    expect(output.html).toBe("");
    expect(output.error).toBeUndefined();
  });

  it("DR1: a successful read returns the scene's content and its sources", async () => {
    const { ctx, outputs } = harness({
      readSceneContent: vi
        .fn()
        .mockResolvedValue({ html: "<p>existing</p>", sourceIds: ["src_1"] }),
    });

    await handleClientToolCall(readCall({ sceneId: OTHER_SCENE }), ctx);

    const output = asRead(outputs[0]);
    expect(output.html).toBe("<p>existing</p>");
    expect(output.sourceIds).toEqual(["src_1"]);
    expect(output.error).toBeUndefined();
  });
});

describe("JF5/JF7 — telling the builder where the content is going", () => {
  it("JF7: the builder hears about the scene before any content reaches it", async () => {
    const order: string[] = [];
    const { ctx } = harness({
      writeSceneContent: vi.fn(async () => {
        order.push("write");
      }),
      announceTargetScene: vi.fn(async () => {
        await Promise.resolve();
        order.push("announce");
      }),
    });

    await handleClientToolCall(insertCall({ html: CLEAN_HTML }), ctx);

    expect(order).toEqual(["announce", "write"]);
  });

  it("JF5: the scene named by the write is the scene announced", async () => {
    const announceTargetScene = vi.fn().mockResolvedValue(undefined);
    const { ctx } = harness({ announceTargetScene });

    await handleClientToolCall(
      insertCall({ sceneId: OTHER_SCENE, html: CLEAN_HTML }),
      ctx,
    );

    expect(announceTargetScene).toHaveBeenCalledWith(OTHER_SCENE);
  });

  it("JF5: reading a scene announces nothing — it changes no course", async () => {
    const announceTargetScene = vi.fn().mockResolvedValue(undefined);
    const { ctx } = harness({ announceTargetScene });

    await handleClientToolCall(readCall({ sceneId: OTHER_SCENE }), ctx);

    expect(announceTargetScene).not.toHaveBeenCalled();
  });

  it("JF5: a write that cannot be placed announces nothing and still reports the failure", async () => {
    const announceTargetScene = vi.fn().mockResolvedValue(undefined);
    const { ctx, outputs } = harness({
      announceTargetScene,
      activeSceneId: undefined,
    });

    await handleClientToolCall(insertCall({ html: CLEAN_HTML }), ctx);

    expect(announceTargetScene).not.toHaveBeenCalled();
    expect(asInsert(outputs[0]).success).toBe(false);
  });
});
