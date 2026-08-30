// @vitest-environment node
import { getSchema } from "@tiptap/core";
import { describe, expect, it } from "vitest";

import { EDITOR_CHAR_LIMIT } from "@/shared/content/editor/runtime/editor-limits";

import { parseSceneHtml, sceneSchema } from "./scene-html";

// Runs without a DOM environment on purpose: this is the transform the browser
// performs inside the editor, and the server has no editor to perform it in.

const GUIDE_CHARACTER =
  '<div data-type="custom-guide-character"><p>Ready to start?</p></div>';

it("has no DOM globals to fall back on", () => {
  expect(globalThis.DOMParser).toBeUndefined();
});

describe("the schema the server validates against", () => {
  it("is the same schema the editor renders with", async () => {
    // Node views are the only client-only half of a block definition. If one
    // ever contributes a node or mark, the server would quietly reject content
    // the editor accepts, so this fails instead.
    const { getClientSchemaExtensions } = await import(
      "@/shared/content/editor/blocks/registry/client"
    );
    const client = getSchema(getClientSchemaExtensions());
    const server = sceneSchema();

    expect({
      nodes: Object.keys(server.nodes).toSorted(),
      marks: Object.keys(server.marks).toSorted(),
      topNode: server.topNodeType.name,
    }).toEqual({
      nodes: Object.keys(client.nodes).toSorted(),
      marks: Object.keys(client.marks).toSorted(),
      topNode: client.topNodeType.name,
    });
  });
});

describe("HTML the editor schema accepts", () => {
  it("becomes the document the editor would have produced", () => {
    const node = parseSceneHtml(
      `${GUIDE_CHARACTER}<p>Hello <strong>world</strong></p>`,
    );

    expect(node.firstChild?.type.name).toBe("custom-guide-character");
    expect(node.textBetween(0, node.content.size, " ")).toBe(
      "Ready to start? Hello world",
    );
  });

  it("keeps a question block's authoring fields and drops the learner's answers", () => {
    const node = parseSceneHtml(
      `<div data-type='custom-multiple-choice' questionblock-data='{"maxPoints":3,"userAnswers":["leaked"]}'></div>`,
    );

    const attributes = JSON.stringify(node.firstChild?.attrs);
    expect(attributes).toContain('"maxPoints":3');
    expect(attributes).not.toContain("leaked");
  });
});

describe("HTML the editor schema does not accept", () => {
  it("names the unknown block rather than silently flattening it", () => {
    expect(() =>
      parseSceneHtml('<div data-type="quiz"><p>Pick one</p></div>'),
    ).toThrow(/quiz/);
  });

  it("refuses unreadable question block data instead of writing it", () => {
    expect(() =>
      parseSceneHtml(
        `<div data-type='custom-multiple-choice' questionblock-data='{'></div>`,
      ),
    ).toThrow(/questionblock-data/);
  });
});

describe("scene size limits, which no plugin enforces out here", () => {
  const oversized = `<p>${"a".repeat(EDITOR_CHAR_LIMIT + 1)}</p>`;

  it("refuses content over the character limit", () => {
    expect(() => parseSceneHtml(oversized)).toThrow(
      new RegExp(`limit is ${EDITOR_CHAR_LIMIT}`),
    );
  });

  it("counts what the document would end up at, not just the new part", () => {
    const existing = parseSceneHtml(
      `<p>${"a".repeat(EDITOR_CHAR_LIMIT - 1)}</p>`,
    );

    expect(() => parseSceneHtml("<p>ab</p>", existing)).toThrow(/limit is/);
    expect(() => parseSceneHtml("<p>a</p>", existing)).not.toThrow();
  });
});
